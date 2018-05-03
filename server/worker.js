const DB = require('./db');
const bcoin = require('bcoin');
const BCC = require('bitcoin-cash-rpc');
const base58check = require('base58check');
const { CONFIG } = require('../config');

const USE_DB = true;

function reverseHexString(str) {
  return str
    .match(/../g)
    .reverse()
    .join('');
}

class Worker {
  constructor() {
    this.bcc = new BCC(
      CONFIG.host || '127.0.0.1',
      CONFIG.user || 'bitcoin',
      CONFIG.password || 'changeme',
      CONFIG.port || 8332,
      CONFIG.timeout || 3000
    );

    // let info = await bcc.getInfo();
    // console.log(info);
  }

  async connect() {
    console.log('Loading database...');
    await DB.sequelize.sync({
      // force: true,
    });
    console.log('Database loaded');
  }

  async sync() {
    this.connect();
    const startBlock = 525546;
    const endBlock = await this.bcc.getBlockCount();
    for (let height = startBlock; height < endBlock; height++) {
      try {
        const blockHash = await this.bcc.getBlockHash(height);
        const blockRaw = await this.bcc.getBlock(blockHash, false);
        const blockBuf = Buffer.from(blockRaw, 'hex');
        const blockObj = bcoin.block.fromRaw(blockBuf, 'hex');
        const block = blockObj.toJSON();
        // console.log(block);
        // console.log(blockHash);
        // console.log('SUCCE', blockBuf.length);

        block.txs.map(tx => {
          tx.outputs.map(output => {
            try {
              const script = output.script.slice(0, 8);

              if (script === '6a026d01') {
                const address = tx.inputs[0].address;
                const mtime = tx.mtime;
                const hash = tx.hash;
                const name = output.script.slice(8);
                const decoded = Buffer.from(name, 'hex');
                // console.log(`${height}: ${address} named: ${decoded}`);
                USE_DB &&
                  DB.Name.create({
                    hash,
                    name,
                    address,
                    height,
                    mtime,
                  });
              } else if (script === '6a026d02') {
                const address = tx.inputs[0].address;
                const mtime = tx.mtime;
                const hash = tx.hash;
                const msg = output.script.slice(8);
                // console.log(`${height}: ${address} said: ${Buffer.from(msg, 'hex')}`);
                USE_DB &&
                  DB.Message.create({
                    hash,
                    msg,
                    address,
                    height,
                    mtime,
                  });
              } else if (script === '6a026d03') {
                const address = tx.inputs[0].address;
                const mtime = tx.mtime;
                const hash = tx.hash;
                const replytx = reverseHexString(
                  output.script.slice(10, 10 + 32 * 2)
                );
                const msg = output.script.slice(10 + 32 * 2);
                // console.log(`${height}: ${address} said: ${Buffer.from(msg, 'hex')}`);
                USE_DB &&
                  DB.Reply.create({
                    hash,
                    address,
                    height,
                    mtime,
                    msg,
                    replytx,
                  });
              } else if (script === '6a026d04') {
                const address = tx.inputs[0].address;
                const mtime = tx.mtime;
                const hash = tx.hash;
                const liketx = reverseHexString(output.script.slice(10));
                let tip = 0;
                tx.outputs.map(out => {
                  if (out.address !== address && !isNaN(out.value)) {
                    tip += out.value;
                  }
                });
                // console.log(`${height}: ${address} liked: ${liketx}`);
                USE_DB &&
                  DB.Like.create({
                    hash,
                    address,
                    height,
                    mtime,
                    liketx,
                    tip,
                  });
              } else if (script === '6a026d06') {
                const address = tx.inputs[0].address;
                const mtime = tx.mtime;
                const hash = tx.hash;
                const follow = base58check.encode(output.script.slice(10));
                // console.log(`${height}: ${address} followed: ${follow}`);
                USE_DB &&
                  DB.Follow.create({
                    hash,
                    address,
                    height,
                    mtime,
                    follow,
                  });
              } else if (script === '6a026d07') {
                const address = tx.inputs[0].address;
                const mtime = tx.mtime;
                const hash = tx.hash;
                const unfollow = base58check.encode(output.script.slice(10));
                // console.log(`${height}: ${address} unfollowed: ${unfollow}`);
                USE_DB &&
                  DB.Unfollow.create({
                    hash,
                    address,
                    height,
                    mtime,
                    unfollow,
                  });
              }
            } catch (err) {
              console.log('Parse error', err);
            }
          });
        });
      } catch (err) {
        console.log('ERROR', err);
      }
    }
  }
}

module.exports = Worker;

// getblockcount
// getbestblockhash
// getblockhash height
// getblock "blockhash" ( verbose )
// getrawtransaction "txid" ( verbose )
