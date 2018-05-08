const DB = require('./db');
const bcoin = require('bcoin');
const BCC = require('bitcoin-cash-rpc');
const base58check = require('base58check');
const {
  BITCOIN_RPC_HOST,
  BITCOIN_RPC_USER,
  BITCOIN_RPC_PASSWORD,
  BITCOIN_RPC_PORT,
  BITCOIN_RPC_TIMEOUT,
} = require('./config');

const USE_DB = true;
const SHOW_LOGS = false;
const THROW_ERRORS = true;
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

  async connect() {
    if (this.connected) return;
    console.log('Loading database...');
    await DB.sequelize.sync({
      // force: true, // WARNING! WIll drop tables
    });
    if (USE_DB) {
      const temp = await DB.Settings.findOrCreate({
        where: { name: 'sync' },
        defaults: { height: START_BLOCK - 1 },
      });
      this.Sync = temp[0];
    }
    this.connected = true;
    console.log('Database loaded');
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

  async autoSyncBlocks() {
    clearTimeout(this.tautoSyncBlocks);
    await this.sync();
    this.tautoSyncBlocks = setTimeout(() => {
      this.autoSyncBlocks();
    }, 1000);
  }

  async checkSyncStatus() {
    await this.connect();
    const endBlock = await this.bcc.getBlockCount();
    const startBlock = USE_DB ? this.Sync.get().height : START_BLOCK;

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
        let obj;
        let model;
        const script1 = output.script.slice(0, 4);
        const script2 = output.script.slice(4, 8);
        const script3 = output.script.slice(8, 10);
        if (script1 === '6a02') {
          // Potential Memo TX
          if (script2 === '6d01') {
            model = DB.Name;
            obj = {
              name: output.script.slice(8),
              protocol: 'memo',
            };
            SHOW_LOGS &&
              console.log(`Memo Name: ${Buffer.from(obj.name, 'hex')}`);
            SHOW_LOGS && console.log(obj.name);
          } else if (script2 === '6d02') {
            model = DB.Message;
            obj = {
              msg: output.script.slice(8),
              protocol: 'memo',
            };
            SHOW_LOGS &&
              console.log(`Memo message: ${Buffer.from(obj.msg, 'hex')}`);
            SHOW_LOGS && console.log(obj.msg);
          } else if (script2 === '6d03') {
            model = DB.Message;
            obj = {
              msg: output.script.slice(10 + 32 * 2),
              replytx: reverseHexString(output.script.slice(10, 10 + 32 * 2)),
              // roottx: undefined,
              protocol: 'memo',
            };
            // Find the parent tx
            obj.roottx = await this.lookupRootTx(obj.replytx);
            SHOW_LOGS &&
              console.log(
                `Memo reply: ${obj.replytx}, ${Buffer.from(obj.msg, 'hex')}`
              );
            SHOW_LOGS && console.log(output.script.slice(8));
          } else if (script2 === '6d04') {
            model = DB.Like;
            obj = {
              liketx: reverseHexString(output.script.slice(10, 10 + 32 * 2)),
              tip: tx.outputs.reduce((previous, out) => {
                return previous +
                  (out.address !== tx.inputs[0].address &&
                    !isNaN(out.value) &&
                    out.value > 0)
                  ? out.value
                  : 0;
              }, 0),
              protocol: 'memo',
            };
            SHOW_LOGS &&
              console.log(`Memo like: ${obj.liketx}, tip: ${obj.tip}`);
          } else if (script2 === '6d05') {
            model = DB.Profile;
            obj = {
              profile: output.script.slice(8),
              protocol: 'memo',
            };
            SHOW_LOGS &&
              console.log(`Memo profile: ${Buffer.from(obj.profile, 'hex')}`);
            SHOW_LOGS && console.log(obj.profile);
          } else if (script2 === '6d06') {
            model = DB.Follow;
            obj = {
              follow: base58check.encode(output.script.slice(10, 10 + 35 * 2)),
              unfollow: false,
              protocol: 'memo',
            };
            SHOW_LOGS && console.log(`Memo follow: ${obj.follow}`);
          } else if (script2 === '6d07') {
            model = DB.Follow;
            obj = {
              follow: base58check.encode(output.script.slice(10, 10 + 35 * 2)),
              unfollow: true,
              protocol: 'memo',
            };
            SHOW_LOGS && console.log(`Memo unfollow: ${obj.follow}`);
          } else if (script2 === '6d0c') {
            const topicLength = parseInt(output.script.slice(8, 10), 16);
            model = DB.Message;
            obj = {
              topic: output.script.slice(10, 10 + topicLength * 2),
              msg: output.script.slice(10 + topicLength * 2),
              protocol: 'memo',
            };
            SHOW_LOGS &&
              console.log(
                `Memo topic ${Buffer.from(obj.topic, 'hex')}: ${Buffer.from(
                  obj.msg,
                  'hex'
                )}`
              );
          }
        }
        if (script1 === '6a4c' || script1 === '6a02') {
          // Protocol change on May 6th 2018 requires 2 checks
          // Potential Blockpress TX
          const scriptBP1 = output.script.slice(6, 10).toLowerCase();
          if (scriptBP1 === '8d01' || script2 === '8d01') {
            const legacy = scriptBP1 === '8d01';
            model = DB.Name;
            obj = {
              name: output.script.slice(legacy ? 10 : 8),
              protocol: 'blockpress',
            };
            SHOW_LOGS &&
              console.log(`Blockpress name: ${Buffer.from(obj.name, 'hex')}`);
          } else if (scriptBP1 === '8d02' || script2 === '8d02') {
            const legacy = scriptBP1 === '8d01';
            model = DB.Message;
            obj = {
              msg: output.script.slice(legacy ? 10 : 8),
              protocol: 'blockpress',
            };
            SHOW_LOGS &&
              console.log(`Blockpress message: ${Buffer.from(obj.msg, 'hex')}`);
          } else if (scriptBP1 === '8d03' || script2 === '8d03') {
            model = DB.Message;
            obj = {
              msg: output.script.slice(10 + 32 * 2),
              replytx: output.script.slice(10, 10 + 32 * 2),
              // roottx: undefined,
              protocol: 'blockpress',
            };
            // Find the parent tx
            obj.roottx = await this.lookupRootTx(obj.replytx);
            SHOW_LOGS &&
              console.log(
                `Blockpress reply: ${obj.replytx}, ${Buffer.from(
                  obj.msg,
                  'hex'
                )}`
              );
          } else if (scriptBP1 === '8d04' || script2 === '8d04') {
            model = DB.Like;
            obj = {
              liketx: output.script.slice(10, 10 + 32 * 2),
              tip: tx.outputs.reduce((previous, out) => {
                return previous +
                  (out.address !== tx.inputs[0].address &&
                    !isNaN(out.value) &&
                    out.value > 0)
                  ? out.value
                  : 0;
              }, 0),
              protocol: 'blockpress',
            };
            SHOW_LOGS &&
              console.log(`Blockpress liked: ${obj.liketx}, tip: ${obj.tip}`);
          } else if (scriptBP1 === '8d06' || script2 === '8d06') {
            model = DB.Follow;
            obj = {
              follow: new Buffer(output.script.slice(10), 'hex').toString(),
              unfollow: false,
              protocol: 'blockpress',
            };
            SHOW_LOGS && console.log(`Blockpress follow: ${obj.follow}`);
          } else if (scriptBP1 === '8d07' || script2 === '8d07') {
            model = DB.Follow;
            obj = {
              follow: new Buffer(output.script.slice(10), 'hex').toString(),
              unfollow: true,
              protocol: 'blockpress',
            };
            SHOW_LOGS && console.log(`Blockpress unfollow: ${obj.follow}`);
          } else if (scriptBP1 === '8d08' || script2 === '8d08') {
            const legacy = scriptBP1 === '8d08';
            model = DB.Header;
            obj = {
              header: output.script.slice(
                legacy ? 10 : script3 === '4c' ? 12 : 10
              ),
              protocol: 'blockpress',
            };
            SHOW_LOGS &&
              console.log(
                `Blockpress header: ${Buffer.from(obj.header, 'hex')}`
              );
          } else if (scriptBP1 === '8d10' || script2 === '8d10') {
            const legacy = scriptBP1 === '8d08';
            model = DB.Avatar;
            obj = {
              avatar: output.script.slice(
                legacy ? 10 : script3 === '4c' ? 12 : 10
              ),
              protocol: 'blockpress',
            };
            SHOW_LOGS &&
              console.log(
                `Blockpress avatar: ${Buffer.from(obj.avatar, 'hex')}`
              );
          } else if (script2 === '8d11') {
            const topicLength = parseInt(output.script.slice(8, 10), 16);
            model = DB.Message;
            obj = {
              topic: output.script.slice(10, 10 + topicLength * 2),
              msg: output.script.slice(10 + topicLength * 2),
              protocol: 'blockpress',
            };
            SHOW_LOGS &&
              console.log(
                `Blockpress topic ${Buffer.from(
                  obj.topic,
                  'hex'
                )}: ${Buffer.from(obj.msg, 'hex')}`
              );
          }
        }
        if (USE_DB && obj) {
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
          if (USE_DB) await this.Sync.update({ height });
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
      if (THROW_ERRORS) throw err;
    }
  }

  async lookupRootTx(replytx) {
    if (!USE_DB) return;
    let roottx;
    try {
      const tempTxs = {};
      let lookuptx = replytx;
      do {
        const msg = await DB.Message.findOne({
          where: { hash: lookuptx },
          raw: true,
          attributes: ['hash', 'replytx', 'roottx'],
        });
        lookuptx = null;
        if (msg) {
          if (tempTxs[msg.hash]) {
            // Loop. Break out
          } else if (msg.roottx) {
            roottx = msg.roottx;
          } else if (msg.replytx) {
            lookuptx = msg.replytx;
          } else if (msg.hash) {
            roottx = msg.hash;
          } else {
            throw new Error('Sould not happen');
          }
          tempTxs[msg.hash] = true;
        } else {
          console.log(
            '*************************** COULD NOT FIND TX ***************************'
          );
        }
      } while (lookuptx);
    } catch (err) {
      console.log('ERROR roottx lookup', err);
      if (THROW_ERRORS) throw err;
    }
    return roottx;
  }
}

module.exports = Worker;
