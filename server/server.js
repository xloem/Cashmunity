const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const simplelogger = require('simple-node-logger');

const Memo = require('./memo');
const memo = new Memo();
const Worker = require('./worker');
const worker = new Worker();

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
  LOG && console.log('/', req.query);
  res.send('Hello world!');
});
app.get('/messages/:address', async (req, res) => {
  LOG && console.log('/messages', req.params);
  res.json(await memo.messages({ ...req.params, height: req.query.height }));
});
app.get('/replies/:replytx', async (req, res) => {
  LOG && console.log('/replies', req.params);
  res.json(await memo.replies({ ...req.params, height: req.query.height }));
});
app.get('/likes/:address', async (req, res) => {
  LOG && console.log('/likes', req.params);
  res.json(await memo.likes({ ...req.params, height: req.query.height }));
});
app.get('/name/:address', async (req, res) => {
  LOG && console.log('/name', req.params);
  res.json(await memo.name(req.params));
});
app.get('/follows/:address', async (req, res) => {
  LOG && console.log('/follows', req.params);
  res.json(await memo.follows(req.params));
});
app.get('/feed/:address', async (req, res) => {
  LOG && console.log('/feed', req.params);
  res.json(await memo.feed({ ...req.params, height: req.query.height }));
});
app.get('/top', async (req, res) => {
  LOG && console.log('/top', req.query);
  res.json(await memo.top(req.query));
});

app.listen(PORT, HOST, () => consoleLog.info(`Listening on port ${PORT}.`));
