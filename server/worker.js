const DB = require('./db');
const bcoin = require('bcoin');
const BCC = require('bitcoin-cash-rpc');
const Memo = require('./protocols/memo');
const Blockpress = require('./protocols/blockpress');
const { DB_DISABLE } = require('./config');

const {
  BITCOIN_RPC_HOST,
  BITCOIN_RPC_USER,
  BITCOIN_RPC_PASSWORD,
  BITCOIN_RPC_PORT,
  BITCOIN_RPC_TIMEOUT,
} = require('./config');

const THROW_ERRORS = true;
const START_BLOCK = 525471;
const MAX_BLOCK_HEIGHT = 999999999999;

class Worker {
  constructor() {
    this.start();
  }

  async connect() {
    if (this.connected) return;
    if (!DB_DISABLE) {
      console.log('Loading database...');
      await DB.sequelize.sync({
        // force: true, // WARNING! Will drop tables
      });
      const temp = await DB.Settings.findOrCreate({
        where: { name: 'sync' },
        defaults: { height: START_BLOCK - 1 },
      });
      this.SyncObj = temp[0];
      console.log('Database loaded');
    }
    this.connected = true;
  }

  async start() {
    this.bcc = new BCC(
      BITCOIN_RPC_HOST,
      BITCOIN_RPC_USER,
      BITCOIN_RPC_PASSWORD,
      BITCOIN_RPC_PORT,
      BITCOIN_RPC_TIMEOUT
    );
    await this.autoSyncBlocks();
    await this.clearMempool();
    await this.autoSyncMempool();
    this.checkFullySynced();
  }

  async checkSyncStatus() {
    await this.connect();
    const endBlock = await this.bcc.getBlockCount();
    const startBlock = !DB_DISABLE ? this.SyncObj.get().height : START_BLOCK;
    return { startBlock, endBlock };
  }
  async checkFullySynced() {
    const { startBlock, endBlock } = await this.checkSyncStatus();
    if (startBlock === endBlock) {
      console.log('==================Fully synced==================');
    }
  }

  async processTx(tx, height, forceUpdate) {
    tx.outputs.map(async output => {
      try {
        let parsedTx = await Memo.parseTx(tx, output);
        if (!parsedTx) {
          parsedTx = await Blockpress.parseTx(tx, output);
        } else {
          // Does not match protocols
        }
        if (!DB_DISABLE && parsedTx) {
          const { obj, model } = parsedTx;
          obj.hash = tx.hash;
          obj.address = tx.inputs[0].address;
          obj.height = height;
          if (forceUpdate) {
            model.upsert(obj);
          } else {
            obj.mtime = tx.mtime; // First seen
            model.create(obj);
          }
        }
      } catch (err) {
        console.log('Parse error', err);
        if (THROW_ERRORS) throw err;
      }
    });
  }

  async autoSyncBlocks() {
    clearTimeout(this.tautoSyncBlocks);
    await this.syncBlocks();
    this.tautoSyncBlocks = setTimeout(() => {
      this.autoSyncBlocks();
    }, 1000);
  }
  async syncBlocks() {
    if (this.syncing) return;
    this.syncing = true;
    try {
      const { endBlock, startBlock } = await this.checkSyncStatus();
      if (startBlock < endBlock) {
        console.log('Syncing Memos...', startBlock, endBlock);
      }
      for (let height = startBlock + 1; height <= endBlock; height++) {
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
          if (!DB_DISABLE) await this.SyncObj.update({ height });
          this.checkFullySynced();
        } catch (err) {
          console.log('ERROR', err);
          if (THROW_ERRORS) throw err;
        }
      }
    } catch (err) {
      console.log('ERROR', err);
      if (THROW_ERRORS) throw err;
    }
    this.syncing = false;
  }

  async autoSyncMempool() {
    clearTimeout(this.tautoSyncMempool);
    await this.syncMempool();
    this.tautoSyncMempool = setTimeout(() => this.autoSyncMempool(), 1000);
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
      if (THROW_ERRORS) throw err;
    }
  }
  async clearMempool() {
    if (!DB_DISABLE) {
      await this.connect();
      await DB.Name.destroy({ where: { height: MAX_BLOCK_HEIGHT } });
      await DB.Like.destroy({ where: { height: MAX_BLOCK_HEIGHT } });
      await DB.Message.destroy({ where: { height: MAX_BLOCK_HEIGHT } });
      await DB.Follow.destroy({ where: { height: MAX_BLOCK_HEIGHT } });
      console.log('!!!!!!!!!!!!!!! Cleared mempool txs !!!!!!!!!!!!!!!');
    }
    this.txids = new Set();
  }

  async boadcastTransaction({ tx }) {
    await this.connect();
    return await this.bcc.sendRawTransaction(tx);
  }
}

module.exports = Worker;
