const ConfigServer = require('./config-server');
const Logger = require('./logger');
const lightsIgor = require('./drivers/lights-igor');
const lightsMolex = require('./drivers/lights-molex');
const lightsHue = require('./drivers/lights-hue');
const shades = require('./drivers/shades');
const fake = require('./drivers/fake-devices/');

function routeCommand(command, answer) {
  console.log(command);
  try {
    _routeCommand(command, answer);
  }
  catch(e) {
    console.log('Not able to process command', e);
  }
}

function _routeCommand(command, answer) {
  const config = ConfigServer.current();
  const request = {
    url: '/api/command',
    options: {
      method: 'POST',
      body: command,
    },
  };

  const log = Logger.logIncoming(request, command.type, command.device);

  // for heartbeat we return ok even if device isnt known
  if (command.type === 'heartbeat') {
    log.response = { status: 200, ok: true };
    answer(true);
    return;
  }

  const device = config.devices?.find(d => d.device === command.device);
  if (!device) {
    console.warn('unknown device', command.device);
    log.response = { status: 400, ok: false, text: 'Unknown device' };
    answer('RoomHub does not know this device. You can add the device from the RoomHub admin ui.', 400);
    return;
  }

  log.response = { status: 200, statusText: 'OK', ok: true };

  if (command.type === 'lights') {
    const type = device?.lights?.type;

    if (type === 'igor') {
      lightsIgor(command, answer);
    }
    else if (type === 'molex') {
      lightsMolex(command, answer);
    }
    else if (type === 'hue') {
      lightsHue(command, answer);
    }
    else if (type === 'fake') {
      fake(command, answer);
    }
    else {
      console.warn('unknown light type', device?.lights);
      answer('Unknown lights', 400);
      log.response = { status: 400, ok: false, text: 'Unknown light type' };
    }
  }
  else if (command.type === 'shades') {
    shades(command, answer);
  }
  else if (command.type === 'heartbeat') {
    answer(true);
  }
  else if (command.type === 'report-issue') {
    // todo
    console.log('TODO report issue')
  }
  else {
    console.log('Unknown type', command.type);
    answer(false);
    log.response = { status: 400, ok: false, text: 'Unknown command ' + command.type };
  }
}

module.exports = routeCommand;
