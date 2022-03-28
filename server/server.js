var fs = require('fs');
var path = require("path");
var http = require('http');
var https = require('https');
const express = require('express');
const bodyParser = require('body-parser');

const onCommand = require('./controller');
const ConfigServer = require('./config-server');
const Logger = require('./logger');

ConfigServer.loadConfig();

const app = express();
const port = 8080;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// a simple registry for storing mocked integration values
const fakeValues = {};

function jsonBack(res, object, code) {
  res.setHeader('Content-Type', 'application/json');
  if (code) {
    res.status(code);
  }
  res.end(JSON.stringify(object));
}

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
  jsonBack(res, Logger.lastLogs());
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

  let panels = { lights: null, shades: null };
  if (item) {
    const { shades, lights }  = item;
    panels.shades = shades && fs.readFileSync('./html/macro/shades.xml').toString();
    panels.lights = lights && fs.readFileSync('./html/macro/lights.xml').toString();
    panels['report-issue'] = fs.readFileSync('./html/macro/report-issue.xml').toString();
  }

  jsonBack(res, panels);
});

app.get('/api/fake', (req, res) => jsonBack(res, fakeValues));

app.use(express.static('html/'));


let server = http.createServer(app);

try {
  const certs_path = path.resolve("./server/certs");

  const key  = fs.readFileSync(certs_path + '/key.pem', 'utf8');
  const cert = fs.readFileSync(certs_path + '/cert.pem', 'utf8');

  server = https.createServer({key, cert}, app);
} catch (ex) {
  console.warn("failed to load certificate, falling back to http")
}

server.listen(port, () => console.log(`Web server on port ${port}!`));
