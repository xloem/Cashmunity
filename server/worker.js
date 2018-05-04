const DB = require('./db');
const bcoin = require('bcoin');
const BCC = require('bitcoin-cash-rpc');
const base58check = require('base58check');
const { CONFIG } = require('../config');

const USE_DB = true;
const START_BLOCK = 525546;

function reverseHexString(str) {
  return str
    .match(/../g)
    .reverse()
    .join('');
}

class Worker {
  constructor() {
    this.start();
  }

  async start() {
    this.bcc = new BCC(
      CONFIG.host || '127.0.0.1',
      CONFIG.user || 'bitcoin',
      CONFIG.password || 'changeme',
      CONFIG.port || 8332,
      CONFIG.timeout || 3000
    );

    await this.autoSync();
    this.checkFullySynced();
  }

  async autoSync() {
    clearTimeout(this.tautoSync);
    await this.sync();
    this.tautoSync = setTimeout(() => {
      this.autoSync();
    }, 1000);
  }

  async connect() {
    if (this.connected) return;
    console.log('Loading database...');
    await DB.sequelize.sync({
      // force: true,
    });
    const temp = await DB.Settings.findOrCreate({
      where: { name: 'sync' },
      defaults: { height: START_BLOCK },
    });
    this.Sync = temp[0];
    this.connected = true;
    console.log('Database loaded');
  }

  async checkSyncStatus() {
    await this.connect();
    const endBlock = await this.bcc.getBlockCount();
    const startBlock = this.Sync.get().height;
    return { startBlock, endBlock };
  }
  async checkFullySynced() {
    const { startBlock, endBlock } = await this.checkSyncStatus();
    if (startBlock === endBlock) {
      console.log('==================Fully synced==================');
    }
  }

  async processTx(tx, height) {
    tx.outputs.map(output => {
      try {
        const script = output.script.slice(0, 8);

        if (script === '6a026d01') {
          const address = tx.inputs[0].address;
          const mtime = tx.mtime;
          const hash = tx.hash;
          const name = output.script.slice(8);
          // console.log(`${height}: ${address} named: ${Buffer.from(name, 'hex')}`);
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
            DB.Message.create({
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
        } else if (script === '6a026d06' || script === '6a026d07') {
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
              unfollow: script === '6a026d07',
            });
        }
      } catch (err) {
        console.log('Parse error', err);
      }
    });
  }

  async sync() {
    if (this.syncing) return;
    this.syncing = true;

    try {
      await this.connect();
      const { endBlock, startBlock } = await this.checkSyncStatus();
      if (startBlock < endBlock) {
        console.log('Syncing Memos...', startBlock, endBlock);
      }

      let height;
      for (height = startBlock + 1; height <= endBlock; height++) {
        console.log('Syncing block', height);
        try {
          const blockHash = await this.bcc.getBlockHash(height);
          const blockRaw = await this.bcc.getBlock(blockHash, false);
          const blockBuf = Buffer.from(blockRaw, 'hex');
          const blockObj = bcoin.block.fromRaw(blockBuf, 'hex');
          const block = blockObj.toJSON();
          block.txs.map(async tx => {
            await this.processTx(tx, height);
          });
          await this.Sync.update({ height });
          this.checkFullySynced();
        } catch (err) {
          console.log('ERROR', err);
        }
      }
    } catch (err) {
      console.log('ERROR', err);
    }
    this.syncing = false;
  }
}

module.exports = Worker;

// getblockcount
// getbestblockhash
// getblockhash height
// getblock "blockhash" ( verbose )
// getrawtransaction "txid" ( verbose )
