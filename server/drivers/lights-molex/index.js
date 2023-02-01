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

  // console.log('on light command', command);
  const { zone, gateway } = device.lights;
  const level = parseInt(command.level);

  try {
    await setMolexLight(gateway, zone, level, command.device);
    answer({ result: true });
  }
  catch(e) {
    answer({ error: 'error' });
  }
}

module.exports = onCommand;
