var fs = require('fs');
var path = require("path");
var http = require('http');
var https = require('https');
const express = require('express');
const bodyParser = require('body-parser');

const ConfigServer = require('./config-server');
ConfigServer.loadConfig();

const routes = require('./routes');

const db = require('./db');

db.init('roomhub.db');

const app = express();
const port = ConfigServer.current().port || 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

routes(app, db);

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

server.listen(port, () => console.log(`Web server on port ${port}!\n`));
