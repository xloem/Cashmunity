const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const simplelogger = require('simple-node-logger');

const Memo = require('./memo');
const memo = new Memo();

const LOG = false;
const PORT = 8081;
const HOST = '0.0.0.0';

let consoleLog = {
  info: (...msg) => console.log(...msg),
  warn: (...msg) => console.log(...msg),
  error: (...msg) => console.log(...msg),
  log: (...msg) => console.log(...msg),
};
if (LOG) {
  consoleLog = simplelogger.createSimpleLogger({
    logFilePath: path.join(__dirname, '../logs/server.log'),
    timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
  });
}

app.use(cors());
app.use(compression());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  // LOG && console.log('/', req.query);
  res.send('Hello world!');
});

app.get('/messages/:address', async (req, res) => {
  LOG && console.log('/messages', req.params);
  res.json(await memo.messages(req.params));
});

// app.post('/something', async (req, res) => {
//   LOG && console.log('/something', req.body);
//   res.json(await memo.something(req.body));
// });

app.listen(PORT, HOST, () => consoleLog.info(`Listening on port ${PORT}.`));
