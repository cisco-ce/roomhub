const createToken = require('./jwt');
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
  
  const path = `inxs/api/authenticate`;
  const request = mhtRequest(gateway, path, 'POST', { username: settings?.apiKey, password : settings?.apiSecret });
  //console.log("Sending request ",request);
  return Logger.fetchAndLog(request, 'Authenticate', device);
}

function changeMhtLightLevel(gateway, zone, level, token, device) {
  //console.log("device=",device);
  const path = `inxs/api/channelControl`;
  const request = mhtRequest(gateway, path, 'POST', { id_token: token, channelId : 0, targetType: 2, targetId: zone, command: 'DIM', dimLevel: level  });
  console.log("Sending request ",request);
  return Logger.fetchAndLog(request, 'Set MHT light', device);
}

async function onCommand(command, answer) {
  
  const config = Config.current();
  const device = config.devices?.find(d => d.device === command.device);

  // console.log('on light command', command);
  const { zone, gateway } = device.lights;
  const level = parseInt(command.level);

  let request;
  try {
    request = await authenticate(gateway,command.device);
    
    if ( request.status == 200 ) {
      authResponse = await request.json();
      console.log("auth response=",authResponse);
      
      if ( authResponse.responseCode != 0 ) {
        request = await changeMhtLightLevel(gateway, zone, level, authResponse.id_token, command.device);
        lcResponse = await request.json();
        console.log("light command response=",lcResponse);
        if ( request.status == 200 )  answer({result: true});
        else answer({ result: false });
      }
      else {
        answer('Invalid gateway credentials', 400);
        answer({result: false});
      }
    }
    else answer({ result: false });
  }
  catch(e) {
    //console.log(e);
    answer('No light configured or invalid url', 400);
  }
}

module.exports = onCommand;
