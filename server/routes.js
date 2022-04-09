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

function createRoutes(app) {
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

  app.post('/api/command', (req, res) => {
    const { body } = req;
    const answer = (data, code) => jsonBack(res, data, code);
    onCommand(body, answer);
  });

  app.get('/api/commands', (req, res) => {
    jsonBack(res, Logger.lastLogs(500));
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

    let panels = { lights: '', shades: '', 'report-issue': '' };
    if (item) {
      const { shades, lights, report_issue }  = item;
      panels.shades = shades ? fs.readFileSync('./html/macro/shades.xml').toString() : '';
      panels.lights = lights ? fs.readFileSync('./html/macro/lights.xml').toString() : '';
      panels['report-issue'] = report_issue ? fs.readFileSync('./html/macro/report-issue.xml').toString() : '';
    }

    jsonBack(res, panels);
  });

  app.get('/api/fake', (req, res) => jsonBack(res, fakeValues));
}

module.exports = createRoutes;
