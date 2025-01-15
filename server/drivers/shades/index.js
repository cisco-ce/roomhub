const Logger = require('../../logger');
const Config = require('../../config-server');

function setShades(gateway, zone, level, device) {
  const settings = Config.current().shadesSolartrac?.[gateway];
  if (!settings) {
    throw new Error('Gateway not found', settings);
  }
  const { host, token } = settings;
  const url = `${host}?objtype=zone&objid=${zone}&objprop=pos&cmd=set&newval=${level}`;

  const options = {
    method: 'POST',
    headers: {
    'Authorization': 'Basic ' + token,
    },
  };

  console.log('mecho shade', url, options);
  return Logger.fetchAndLog({ url, options }, 'Set Mecho shades', device);
}

async function onCommand(command, answer) {
  const config = Config.current();
  const { position } = command;
  const device = config.devices.find(d => d.device === command.device);
  if (device && device.shades) {
    try {
      const { zones, gateway } = device.shades;
      const zoneList = Array.isArray(zones) ? zones : [zones];
        for (const zone of zoneList) {
          // setTimeout(() => setShades(zone, position), n * 100);
          await setShades(gateway, zone, position, command.device);
        }
      answer({ result: true });
    }
    catch(e) {
      answer({ error: true });
    }
  }
  else {
    answer('Device does not have shades configured', 400);
  }
}

module.exports = onCommand;
