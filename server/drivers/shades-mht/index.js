const Logger = require('../../logger');
const Config = require('../../config-server');
const ospath = require('path');


function mhtRequest(gateway, path, method = 'POST', body) {
  
    const config = Config.current();
    const settings = config.lightsMht?.[gateway];
    
    if (!settings) {
      throw new Error('Gateway not found', gateway);
    }
    
    const url = ospath.join(settings?.gateway, path);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    return { url, options };
}
  
function authenticate(gateway,device) {
    const config = Config.current();
    const settings = config.lightsMht?.[gateway];
    
    if (!settings) {
      throw new Error('Gateway not found', gateway);
    }
    
    const path = `api/authenticate`;
    const request = mhtRequest(gateway, path, 'POST', { username: settings?.apiKey, password : settings?.apiSecret });
    console.log("Sending request ",request);
    return Logger.fetchAndLog(request, 'Authenticate', device);
}


function setShades(gateway, zone, level, device, token) {

    const path = `api/shadeControl`;
    const request = mhtRequest(gateway, path, 'POST', { id_token: token, targetType: 1, targetId: zone, command: 'POS', posValue: level  });
    console.log("Sending request ",request);
    return Logger.fetchAndLog(request, 'Set MHT Shade', device);

}

async function onCommand(command, answer) {
    const config = Config.current();
    const { position } = command;
    const device = config.devices.find(d => d.device === command.device);
    if (device && device.shades) {

        const { zones, gateway } = device.shades;
        const zoneList = Array.isArray(zones) ? zones : [zones];

        let request;
        try {
            request = await authenticate(gateway,command.device);
            console.log(request)
            if ( request.status == 200 ) {
                authResponse = await request.json();
                console.log("auth response=",authResponse);

                if ( authResponse.responseCode != 0 ) {

                    for (const zone of zoneList) {
                        // setTimeout(() => setShades(zone, position), n * 100);
                        request = await setShades(gateway, zone, position, command.device, authResponse.id_token);
                        lcResponse = await request.json();
                        console.log("Shade command response=",lcResponse);

                    }

                    answer({result: true});
                }
                else {
                    answer('Invalid gateway credentials', 400);
                    answer({result: false});
                }

            }
            else answer({ result: false });
        }
        catch(e) {
            console.log(e);
            answer('No Shade configured or invalid url', 400);
        }
    }
    else {
        answer('Device does not have shades configured', 400);
    }
}

module.exports = onCommand;