const Logger = require('../../logger');
const Config = require('../../config-server');
const { join } = require('path');

function setMolexLight(gateway, zone, level, device) {
  const settings = Config.current().lightsMolex?.[gateway];
  if (!settings) {
    throw new Error('Gateway not found', settings);
  }
  const { host, projectId, token } = settings;
  const url = join(host, `/transcend/api/v1/zone/brightness?projectid=${projectId}&zoneid=${zone}`);

  const options = {
    method: 'PUT',
    headers: {
    'Authorization': 'Basic ' + token,
    'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ brightness: parseInt(level) }),
  };

  console.log('molex light', url, options);
  return Logger.fetchAndLog({ url, options }, 'Set Molex light', device);
}

async function onCommand(command, answer) {
  const config = Config.current();
  const device = config.devices?.find(d => d.device === command.device);
  
  if (device && device.lights) {
    try {
      const { zone, gateway } = device.lights;
      const zoneList = zone.includes(',') ? zone.split(',') : [zone];
      const level = parseInt(command.level);
      for (const z of zoneList) {
        await setMolexLight(gateway, z.trim(), level, command.device);
      }
      answer({ result: true });
    }
    catch(e) {
      answer({ error: 'error' });
    }
  }
  else {
    answer('Device does not have light configured', 400);
  }
}

module.exports = onCommand;
