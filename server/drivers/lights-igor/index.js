const createToken = require('./jwt');
const Logger = require('../../logger');
const Config = require('../../config-server');
const ospath = require('path');

function igorRequest(gateway, path, method = 'POST', body) {
  const config = Config.current();
  const settings = config.lightsIgor?.[gateway];
  if (!settings) {
    throw new Error('Gateway not found', gateway);
  }
  const token = createToken(settings?.key);
  const url = ospath.join(settings?.gateway, path);
  const options = {
    method,
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  return { url, options };
}

function setLightPower(gateway, zone, on, device) {
  const path = `/api/spaces/${zone}/turn${on ? 'on' : 'off'}`;
  const request = igorRequest(gateway, path, 'POST');
  return Logger.fetchAndLog(request, 'Set Igor light', device);
}

function setLightLevel(gateway, zone, level, device) {
  const path = `/api/spaces/${zone}/lighting`;
  const request = igorRequest(gateway, path, 'POST', { level });
  return Logger.fetchAndLog(request, 'Set Igor light', device);
}

function status() {
  const path = `/api/spaces/`;
  const request = igorRequest(path);
  return Logger.fetchAndLog(request);
}

async function onCommand(command, answer) {
  const config = Config.current();
  const device = config.devices?.find(d => d.device === command.device);

  // console.log('on light command', command);
  const { zone, gateway } = device.lights;

  /* igor is 0-10000 */
  const level = parseInt(command.level) * 100;

  let request;
  try {
    request = await setLightPower(gateway, zone, level > 0, command.device);
    request.response = { status: 200, ok: true };
    if (level > 0) {
      request = await setLightLevel(gateway, zone, level, command.device);
      request.response = { status: 200, ok: true };
    }
    answer({ result: true });
  }
  catch(e) {
    answer('No light configured or invalid url', 400);
  }
}

module.exports = onCommand;
