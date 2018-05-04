const DB = require('./db');
const bcoin = require('bcoin');
const BCC = require('bitcoin-cash-rpc');
const base58check = require('base58check');
const { CONFIG } = require('../config');

const USE_DB = true;
const START_BLOCK = 525471;
const MAX_BLOCK_HEIGHT = 999999999999;

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

    await this.autoSyncBlocks();
    await this.clearMempool();
    await this.autoSyncMempool();
    this.checkFullySynced();
  }

  async autoSyncBlocks() {
    clearTimeout(this.tautoSyncBlocks);
    await this.sync();
    this.tautoSyncBlocks = setTimeout(() => {
      this.autoSyncBlocks();
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
      defaults: { height: START_BLOCK - 1 },
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

  async processTx(tx, height, forceUpdate) {
    tx.outputs.map(output => {
      try {
        const script = output.script.slice(0, 8);
        if (script === '6a026d01') {
          const obj = {
            hash: tx.hash,
            mtime: tx.mtime,
            address: tx.inputs[0].address,
            height,
            name: output.script.slice(8),
          };
          // console.log(`${height}: ${address} named: ${Buffer.from(name, 'hex')}`);
          if (forceUpdate) {
            USE_DB && DB.Name.upsert(obj);
          } else {
            USE_DB && DB.Name.create(obj);
          }
        } else if (script === '6a026d02') {
          const obj = {
            hash: tx.hash,
            mtime: tx.mtime,
            address: tx.inputs[0].address,
            height,
            msg: output.script.slice(8),
          };
          // console.log(`${height}: ${address} said: ${Buffer.from(msg, 'hex')}`);
          if (forceUpdate) {
            USE_DB && DB.Message.upsert(obj);
          } else {
            USE_DB && DB.Message.create(obj);
          }
        } else if (script === '6a026d03') {
          const obj = {
            hash: tx.hash,
            mtime: tx.mtime,
            address: tx.inputs[0].address,
            height,
            msg: output.script.slice(10 + 32 * 2),
            replytx: reverseHexString(output.script.slice(10, 10 + 32 * 2)),
          };
          // console.log(`${height}: ${address} said: ${Buffer.from(msg, 'hex')}`);
          if (forceUpdate) {
            USE_DB && DB.Message.upsert(obj);
          } else {
            USE_DB && DB.Message.create(obj);
          }
        } else if (script === '6a026d04') {
          const obj = {
            hash: tx.hash,
            mtime: tx.mtime,
            address: tx.inputs[0].address,
            height,
            liketx: reverseHexString(output.script.slice(10)),
            tip: 0,
          };
          tx.outputs.map(out => {
            if (out.address !== obj.address && !isNaN(out.value)) {
              obj.tip += out.value;
            }
          });
          // console.log(`${height}: ${address} liked: ${liketx}`);
          if (forceUpdate) {
            USE_DB && DB.Like.upsert(obj);
          } else {
            USE_DB && DB.Like.create(obj);
          }
        } else if (script === '6a026d06' || script === '6a026d07') {
          const obj = {
            hash: tx.hash,
            mtime: tx.mtime,
            address: tx.inputs[0].address,
            height,
            follow: base58check.encode(output.script.slice(10)),
            unfollow: script === '6a026d07',
          };
          // console.log(`${height}: ${address} followed: ${follow}`);
          if (forceUpdate) {
            USE_DB && DB.Follow.upsert(obj);
          } else {
            USE_DB && DB.Follow.create(obj);
          }
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
            await this.processTx(tx, height, true);
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

  async clearMempool() {
    if (USE_DB) {
      await this.connect();
      await DB.Name.destroy({ where: { height: MAX_BLOCK_HEIGHT } });
      await DB.Like.destroy({ where: { height: MAX_BLOCK_HEIGHT } });
      await DB.Message.destroy({ where: { height: MAX_BLOCK_HEIGHT } });
      await DB.Follow.destroy({ where: { height: MAX_BLOCK_HEIGHT } });
      console.log('!!!!!!!!!!!!!!! Cleared mempool txs !!!!!!!!!!!!!!!');
    }
    this.txids = new Set();
  }

  async autoSyncMempool() {
    clearTimeout(this.tautoSyncMempool);
    await this.syncMempool();
    this.tautoSyncMempool = setTimeout(() => {
      this.autoSyncMempool();
    }, 1000);
  }

  async syncMempool() {
    try {
      await this.connect();
      const txidsArray = await this.bcc.getRawMempool(false);
      const txids = new Set(txidsArray);
      const difference = new Set([...txids].filter(x => !this.txids.has(x)));
      for (const txid of difference) {
        const rawtx = await this.bcc.getRawTransaction(txid, false);
        const tx = bcoin.tx.fromRaw(rawtx, 'hex');
        await this.processTx(tx.toJSON(), MAX_BLOCK_HEIGHT);
      }
      this.txids = txids;
    } catch (err) {
      console.log('ERROR', err);
    }
  }
}

module.exports = Worker;

// getblockcount
// getbestblockhash
// getblockhash height
// getblock "blockhash" ( verbose )
// getrawtransaction "txid" ( verbose )
