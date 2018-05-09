const { Models } = require('./db');

function reverseHexString(str) {
  return str
    .match(/../g)
    .reverse()
    .join('');
}

async function lookupRootTx(replytx) {
  let roottx;
  try {
    const tempTxs = {};
    let lookuptx = replytx;
    do {
      const msg = await Models.Message.findOne({
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
          throw new Error('Should not happen');
        }
        tempTxs[msg.hash] = true;
      } else {
        console.log('************** COULD NOT FIND ROOT TX **************');
      }
    } while (lookuptx);
  } catch (err) {
    console.log('ERROR roottx lookup', err);
  }
  return roottx;
}

module.exports = {
  reverseHexString,
  lookupRootTx,
};
