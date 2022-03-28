const ConfigServer = require('../server/config-server');
const Logger = require('../server/logger');
const routeCommand = require('../server/controller');

ConfigServer.loadConfig('./test/testconfig.json');

async function testIgor() {
  try {
    await routeCommand({ type: 'lights', level: 0, device: 'device1234' });
  }
  catch(e) {}
  // console.log(Logger.logs[1].data.request);
}

testIgor();
