const bcoin = require('bcoin');
const raw = require('./block');

const rawBuf = Buffer.from(raw, 'hex');
// console.log();

const block = bcoin.block.fromRaw(rawBuf, 'hex');
console.log('OIWEJFOWIJF', JSON.stringify(block));
