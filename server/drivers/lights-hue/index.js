const Logger = require('../../logger');
const Config = require('../../config-server');
const { join } = require('path');



function setLightLevel(gateway, id, level, device, isGroup = true) {
  const settings = Config.current().lightsHue[gateway];
  if (!settings) {
    throw new Error(`Gateway ${gateway} not found`);
  }
  const { host, token } = settings;

  const path = isGroup ? `groups/${id}/action` : `lights/${id}/state`;
  const url = join(host, `api/${token}`, path);
  const body = JSON.stringify({ bri: level, on: level > 0 });

  const options = {
    headers: {
    'Content-Type': 'application/json; charset=utf-8',
    },
    method: 'PUT',
    body,
  };

  // console.log('hue light', url, options);
  return Logger.fetchAndLog({ url, options }, 'Set Hue light', device);
}

async function onCommand(command, answer) {
  const config = Config.current();
  const device = config.devices?.find(d => d.device === command.device);

  // console.log('on light command', command);
  const { zone, gateway } = device.lights;
  const level = parseInt(command.level * 255 / 100);

  try {
    await setLightLevel(gateway, zone, level, command.device, false);
    answer({ result: true });
  }
  catch(e) {
    console.log(e);
    answer({ error: 'error' });
  }
}

module.exports = onCommand;
