const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

let CONFIG = {
  BITCOIN_RPC_HOST: '127.0.0.1',
  BITCOIN_RPC_USER: 'bitcoin',
  BITCOIN_RPC_PASSWORD: 'changeme',
  BITCOIN_RPC_PORT: 8332,
  BITCOIN_RPC_TIMEOUT: 3000,

  DB_DIALECT: 'sqlite',

  DB_DISABLE: false,
};

try {
  CONFIG = yaml.safeLoad(
    fs.readFileSync(path.join(__dirname, '../config.yaml'), 'utf8')
  );
  console.log('Using config.yaml', {
    ...CONFIG,
    BITCOIN_RPC_PASSWORD: '************',
  });
} catch (e) {
  console.log(e);
}

module.exports = CONFIG;
