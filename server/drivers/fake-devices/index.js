const Logger = require('../../logger');
const Config = require('../../config-server');
const { join } = require('path');

// keep the fake states here, make them available via api so we can visualize them
const state = {}

function setProperty(property, id, value, device) {
  const host = Config.current().fakeDevices?.host;

  const url = join(host, `/api/fake/${property}/${id}/${value}`);
  // console.log('hue light', url, options);
  return Logger.fetchAndLog({ url }, 'Set fake light', device);
}

async function onCommand(command, answer) {
  const config = Config.current();
  const device = config.devices?.find(d => d.device === command.device);

  const { zone } = device.lights;
  const level = parseInt(command.level);
  console.log('set fake light', zone, level);

  if (zone) {
    try {
      await setProperty('light', zone, level, command.device);
      answer(true);
    }
    catch(e) {
      console.log(e);
      answer(false, 400);
    }
  }
  else {
    console.log('no light found');
    answer(false, 400);
  }
}

module.exports = onCommand;
