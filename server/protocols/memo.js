const { Models } = require('../db');
const base58check = require('base58check');
const { reverseHexString, lookupRootTx } = require('../helpers');
const { DB_DISABLE } = require('../config');
const SHOW_LOGS = true;

async function parseTx(tx, output) {
  let model;
  let obj;

  try {
    const script1 = output.script.slice(0, 4);
    if (script1 === '6a02') {
      const script2 = output.script.slice(4, 8);
      // Potential Memo TX
      if (script2 === '6d01') {
        model = Models.Name;
        obj = {
          name: output.script.slice(8),
          protocol: 'memo',
        };
        SHOW_LOGS && console.log(`Memo Name: ${Buffer.from(obj.name, 'hex')}`);
        // SHOW_LOGS && console.log(obj.name);
      } else if (script2 === '6d02') {
        model = Models.Message;
        obj = {
          msg: output.script.slice(8),
          protocol: 'memo',
        };
        SHOW_LOGS &&
          console.log(`Memo message: ${Buffer.from(obj.msg, 'hex')}`);
        // SHOW_LOGS && console.log(obj.msg);
      } else if (script2 === '6d03') {
        model = Models.Message;
        obj = {
          msg: output.script.slice(10 + 32 * 2),
          replytx: reverseHexString(output.script.slice(10, 10 + 32 * 2)),
          // roottx: undefined,
          protocol: 'memo',
        };
        if (!DB_DISABLE) {
          // Find the parent tx
          obj.roottx = await lookupRootTx(obj.replytx);
        }
        SHOW_LOGS &&
          console.log(
            `Memo reply: ${obj.replytx}, ${Buffer.from(obj.msg, 'hex')}`
          );
        // SHOW_LOGS && console.log(output.script.slice(8));
      } else if (script2 === '6d04') {
        model = Models.Like;
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
        SHOW_LOGS && console.log(`Memo like: ${obj.liketx}, tip: ${obj.tip}`);
      } else if (script2 === '6d05') {
        model = Models.Profile;
        obj = {
          profile: output.script.slice(8),
          protocol: 'memo',
        };
        SHOW_LOGS &&
          console.log(`Memo profile: ${Buffer.from(obj.profile, 'hex')}`);
        // SHOW_LOGS && console.log(obj.profile);
      } else if (script2 === '6d06') {
        model = Models.Follow;
        obj = {
          follow: base58check.encode(output.script.slice(10, 10 + 35 * 2)),
          unfollow: false,
          protocol: 'memo',
        };
        SHOW_LOGS && console.log(`Memo follow: ${obj.follow}`);
      } else if (script2 === '6d07') {
        model = Models.Follow;
        obj = {
          follow: base58check.encode(output.script.slice(10, 10 + 35 * 2)),
          unfollow: true,
          protocol: 'memo',
        };
        SHOW_LOGS && console.log(`Memo unfollow: ${obj.follow}`);
      } else if (script2 === '6d0c') {
        const topicLength = parseInt(output.script.slice(8, 10), 16);
        model = Models.Message;
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
  } catch (err) {
    console.log('ERROR Memo', err);
  }
  return obj ? { model, obj } : undefined;
}

module.exports = {
  parseTx,
};
