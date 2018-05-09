const DB = require('../db');
const { lookupRootTx } = require('../helpers');
const { DB_DISABLE } = require('../config');
const SHOW_LOGS = true;

async function parseTx(tx, output) {
  let model;
  let obj;
  try {
    const script1 = output.script.slice(0, 4);
    if (script1 === '6a4c' || script1 === '6a02') {
      // Protocol change on May 6th 2018 requires 2 checks
      // Potential Blockpress TX
      const script2 = output.script.slice(4, 8);
      const scriptBPLegacy = output.script.slice(6, 10);
      if (scriptBPLegacy === '8d01' || script2 === '8d01') {
        const legacy = scriptBPLegacy === '8d01';
        model = DB.Name;
        obj = {
          name: output.script.slice(legacy ? 10 : 8),
          protocol: 'blockpress',
        };
        SHOW_LOGS &&
          console.log(`Blockpress name: ${Buffer.from(obj.name, 'hex')}`);
      } else if (scriptBPLegacy === '8d02' || script2 === '8d02') {
        const legacy = scriptBPLegacy === '8d01';
        model = DB.Message;
        obj = {
          msg: output.script.slice(legacy ? 10 : 8),
          protocol: 'blockpress',
        };
        SHOW_LOGS &&
          console.log(`Blockpress message: ${Buffer.from(obj.msg, 'hex')}`);
      } else if (scriptBPLegacy === '8d03' || script2 === '8d03') {
        model = DB.Message;
        obj = {
          msg: output.script.slice(10 + 32 * 2),
          replytx: output.script.slice(10, 10 + 32 * 2),
          // roottx: undefined,
          protocol: 'blockpress',
        };
        if (!DB_DISABLE) {
          // Find the parent tx
          obj.roottx = await lookupRootTx(obj.replytx);
        }
        SHOW_LOGS &&
          console.log(
            `Blockpress reply: ${obj.replytx}, ${Buffer.from(obj.msg, 'hex')}`
          );
      } else if (scriptBPLegacy === '8d04' || script2 === '8d04') {
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
      } else if (scriptBPLegacy === '8d06' || script2 === '8d06') {
        model = DB.Follow;
        obj = {
          follow: new Buffer(output.script.slice(10), 'hex').toString(),
          unfollow: false,
          protocol: 'blockpress',
        };
        SHOW_LOGS && console.log(`Blockpress follow: ${obj.follow}`);
      } else if (scriptBPLegacy === '8d07' || script2 === '8d07') {
        model = DB.Follow;
        obj = {
          follow: new Buffer(output.script.slice(10), 'hex').toString(),
          unfollow: true,
          protocol: 'blockpress',
        };
        SHOW_LOGS && console.log(`Blockpress unfollow: ${obj.follow}`);
      } else if (scriptBPLegacy === '8d08' || script2 === '8d08') {
        const legacy = scriptBPLegacy === '8d08';
        model = DB.Header;
        obj = {
          header: output.script.slice(legacy ? 10 : 8),
          protocol: 'blockpress',
        };
        SHOW_LOGS &&
          console.log(`Blockpress header: ${Buffer.from(obj.header, 'hex')}`);
      } else if (scriptBPLegacy === '8d10' || script2 === '8d10') {
        const legacy = scriptBPLegacy === '8d08';
        model = DB.Avatar;
        obj = {
          avatar: output.script.slice(legacy ? 10 : 8),
          protocol: 'blockpress',
        };
        SHOW_LOGS &&
          console.log(`Blockpress avatar: ${Buffer.from(obj.avatar, 'hex')}`);
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
            `Blockpress topic ${Buffer.from(obj.topic, 'hex')}: ${Buffer.from(
              obj.msg,
              'hex'
            )}`
          );
      }
    }
  } catch (err) {
    console.log('ERROR Blockpress', err);
  }
  return obj ? { model, obj } : undefined;
}

module.exports = {
  parseTx,
};
