const { Models } = require('../db');
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
        model = Models.Name;
        obj = {
          name: output.script.slice(legacy ? 10 : 8),
          protocol: 'blockpress',
        };
        SHOW_LOGS &&
          console.log(`Blockpress name: ${Buffer.from(obj.name, 'hex')}`);
      } else if (scriptBPLegacy === '8d02' || script2 === '8d02') {
        const legacy = scriptBPLegacy === '8d01';
        model = Models.Message;
        obj = {
          msg: output.script.slice(legacy ? 10 : 8),
          protocol: 'blockpress',
        };
        SHOW_LOGS &&
          console.log(`Blockpress message: ${Buffer.from(obj.msg, 'hex')}`);
      } else if (scriptBPLegacy === '8d03' || script2 === '8d03') {
        model = Models.Message;
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
        model = Models.Like;
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
        model = Models.Follow;
        obj = {
          follow: new Buffer(output.script.slice(10), 'hex').toString(),
          unfollow: false,
          protocol: 'blockpress',
        };
        SHOW_LOGS && console.log(`Blockpress follow: ${obj.follow}`);
      } else if (scriptBPLegacy === '8d07' || script2 === '8d07') {
        model = Models.Follow;
        obj = {
          follow: new Buffer(output.script.slice(10), 'hex').toString(),
          unfollow: true,
          protocol: 'blockpress',
        };
        SHOW_LOGS && console.log(`Blockpress unfollow: ${obj.follow}`);
      } else if (scriptBPLegacy === '8d08' || script2 === '8d08') {
        const legacy = scriptBPLegacy === '8d08';
        model = Models.Header;
        obj = {
          header: output.script.slice(legacy ? 10 : 8),
          protocol: 'blockpress',
        };
        SHOW_LOGS &&
          console.log(`Blockpress header: ${Buffer.from(obj.header, 'hex')}`);
      } else if (scriptBPLegacy === '8d10' || script2 === '8d10') {
        const legacy = scriptBPLegacy === '8d08';
        model = Models.Avatar;
        obj = {
          avatar: output.script.slice(legacy ? 10 : 8),
          protocol: 'blockpress',
        };
        SHOW_LOGS &&
          console.log(`Blockpress avatar: ${Buffer.from(obj.avatar, 'hex')}`);
      } else if (script2 === '8d11') {
        const topicLength = parseInt(output.script.slice(8, 10), 16);
        model = Models.Message;
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
      } else if (script2 === '8d09') {
        // v1.2: Create Media Post
        const TYPES = {
          '00': 'reserved',
          '01': 'img',
        };
        const type = output.script.slice(10, 12);
        const mediaLength = parseInt(output.script.slice(12, 14), 16);
        model = Models.Message;
        obj = {
          media: output.script.slice(14, 14 + mediaLength * 2),
          type: TYPES[type] || 'unknown',
          msg: output.script.slice(14 + mediaLength * 2),
          protocol: 'blockpress',
        };
        SHOW_LOGS &&
          console.log(
            `Blockpress media ${obj.type}, ${Buffer.from(
              obj.media,
              'hex'
            )}: ${Buffer.from(obj.msg, 'hex')}`
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
