var fs = require('fs');
const basicAuth = require('express-basic-auth');

const Logger = require('./logger');
const onCommand = require('./controller');
const ConfigServer = require('./config-server');

const config = ConfigServer.current();

const admin = {
  admin: config.passwords?.admin || '',
};

const readonly = {
  admin: config.passwords?.admin || '',
  readonly: config.passwords?.readonly || '',
}

const macro = {
  admin: config.passwords?.admin || '',
  readonly: config.passwords?.readonly || '',
  macro: config.passwords?.macro || '',
};


const auth = users => basicAuth({
  users,
  challenge: true,
  realm: 'roomhub',
});

// a simple registry for storing mocked integration values
const fakeValues = {};

function jsonBack(res, object, code) {
  res.setHeader('Content-Type', 'application/json');
  if (code) {
    res.status(code);
  }
  res.end(JSON.stringify(object));
}

function createRoutes(app, db) {
  app.get('/api/test', auth(macro), (req, res) => {
    jsonBack(res, { test: 'hello' });
  });

  // Save a configuration
  app.post('/api/config', auth(admin), (req, res) => {
    const config = req.body;
    ConfigServer.saveConfig(config);
    jsonBack(res, true);
  });

  // Fetch a configuration
  app.get('/api/config', auth(readonly), (req, res) => {
    const { config } = ConfigServer;
    jsonBack(res, config);
  });

  // Receive command (eg adjust light, from a cisco device)
  app.post('/api/command', auth(macro), (req, res) => {
    const { body } = req;
    const answer = (data, code) => jsonBack(res, data, code);
    onCommand(body, answer);
  });

  // Fetch all commands (to show logs etc)
  app.get('/api/commands', auth(readonly), (req, res) => {
    const heartbeat = parseInt(req.query.heartbeat) || false;
    jsonBack(res, Logger.lastLogs(500, heartbeat));
  });

  // For Cisco device to query which UI extensions to install locally
  app.get('/api/uiextensions/:device', auth(macro), (req, res) => {
    const device = req.params.device;
    const { config } = ConfigServer;
    const item = config.devices && config.devices.find(d => d.device === device);

    const uiFile = name => fs.readFileSync('./html/macro/' + name).toString();

    let panels = {
      lights: '',
      shades: '',
      'report-issue': '',
    };

    if (item) {
      const { shades, lights, reportIssue }  = item;
      panels.shades = shades ? uiFile('shades.xml') : '';
      panels.lights = lights ? uiFile('lights.xml') : '';
      panels['report-issue'] = reportIssue ? uiFile('report-issue.xml') : '';
    }

    jsonBack(res, panels);
  });

  // For testing without physical lights etc
  app.get('/api/fake/:property/:id/:value', (req, res) => {
    const { property, id, value } = req.params;
    fakeValues[property + id] = value;
    jsonBack(res, { property, id, value });
  });

  app.get('/api/fake', (req, res) => jsonBack(res, fakeValues));
}

module.exports = createRoutes;
