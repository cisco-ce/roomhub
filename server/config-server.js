/**
 * Singleton for project config
 * Config can be updated dynamically without restarting application
 */
const fs = require('fs');

const defaultFile = './config.json';

class ConfigServer {

  static config = {};

  static loadConfig(file = '') {
    const path = file || process.env.CONFIG_FILE || defaultFile;

    try {
      const file = fs.readFileSync(path);
      console.log('Loaded config', path);
      this.config = JSON.parse(file.toString());
    }
    catch(e) {
      console.error('Not able to read config file', path);
      process.exit(1);
    }
  }

  static current() {
    return this.config;
  }

  static saveConfig(content) {
    const path = process.env.CONFIG_FILE || './config.json';
    const json = JSON.stringify(content, null, 2);
    this.config = content;
    fs.writeFileSync(path, json);
  }

}

module.exports = ConfigServer;
