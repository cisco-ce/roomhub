var fs = require('fs');

const Logger = require('./logger');
const onCommand = require('./controller');
const ConfigServer = require('./config-server');

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
  app.get('/api/test', (req, res) => {
    jsonBack(res, { test: 'hello' });
  });

  app.post('/api/config', (req, res) => {
    const config = req.body;
    ConfigServer.saveConfig(config);
    jsonBack(res, true);
  });

  app.get('/api/config', (req, res) => {
    const { config } = ConfigServer;
    jsonBack(res, config);
  });

  app.post('/api/data', async (req, res) => {
    console.log('got data', req.body);
    try {
      await db.saveRoomData(req.body);
      jsonBack(res, { ok: true });
    }
    catch(e) {
      jsonBack(res, error.reason, 400);
    }
  });

  app.get('/api/data', async (req, res) => {
    try {
      const data = await db.getCurrentRoomData();
      jsonBack(res, data);
    }
    catch(e) {
      jsonBack(res, error.reason, 400);
    }
  });

  app.post('/api/command', (req, res) => {
    const { body } = req;
    const answer = (data, code) => jsonBack(res, data, code);
    onCommand(body, answer);
  });

  app.get('/api/commands', (req, res) => {
    const heartbeat = parseInt(req.query.heartbeat) || false;
    jsonBack(res, Logger.lastLogs(500, heartbeat));
  });

  app.get('/api/fake/:property/:id/:value', (req, res) => {
    const { property, id, value } = req.params;
    fakeValues[property + id] = value;
    jsonBack(res, { property, id, value });
  });

  app.get('/api/uiextensions/:device', (req, res) => {
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

  app.get('/api/fake', (req, res) => jsonBack(res, fakeValues));
}

module.exports = createRoutes;
