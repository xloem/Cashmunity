// const bcoin = require('bcoin');
// const bs58 = require('bs58')

// 003c176e659bea0f29a3e9bf7880c112b1b31b4dc826268187
// fe686b9b2ab589a3cb3368d02211ca1a9b88aa42
// 140efd509bf1089b0106cbd1950d3dc7d76cbe6947
// 20e0ae5cb0a85d8adf5c6805f497a906bc01e1770049b2a25496f3221f37b2d813

const hexaddr = 'fe686b9b2ab589a3cb3368d02211ca1a9b88aa42';
// const hexaddr = '6f928593be54b8c01f03a7eb477b64d621b8725fca9fd2ef1acf0f4f579cf44d';
// for (let i = 0; i < 20; i++) {
//   // const bytes = Buffer.from(hexaddr.slice(0, hexaddr.length - i), 'hex')
//   // const bytes = Buffer.from(hexaddr.slice(i), 'hex')
//   // const bytes = Buffer.from(hexaddr.slice(i % 2 === 0 ? i : i + 1), 'hex')
//   const bytes = Buffer.from(hexaddr, 'hex')
//   const address = bs58.encode(bytes)
//   console.log(address)
// }

const base58check = require('base58check');

const data = '086eaa677895f92d4a6c5ef740c168932b5e3f44';
console.log(base58check.encode(hexaddr)); // => 1mayif3H2JDC62S4N3rLNtBNRAiUUP99k

// 086eaa677895f92d4a6c5ef740c168932b5e3f44
// 1mayif3H2JDC62S4N3rLNtBNRAiUUP99k
// 1QCBiyfwdjXDsHghBEr5U2KxUpM2BmmJVt

// const address = '16UjcYNBG9GTK4uq2f7yYEbuifqCzoLMGS'
// const bytes = bs58.decode(address)
// console.log(bytes.toString('hex'))

// let BCC = require('bitcoin-cash-rpc');
// let bcc = new BCC(
//   '127.0.0.1',
//   'bitcoinrpc',
//   '8c2833024e5c2c780ad08b9d7b11d02d',
//   8332,
//   3000
// );

// (async () => {
//   // let info = await bcc.getInfo();
//   // console.log(info);
//
//   // const invalidHash =
//   //   '0000000000000000020a6fb0d9fa0607ae43bf8e78c01b45befb358bbdcd39f8';
//   // const validHash =
//   //   '0000000000000000025f32b072e25e1c4bc67a6ba7d46197a344cdf0c4677310';
//   //
//   // console.log('Is valid', bcc.isValidAddress(validHash));
//   // console.log('Is invalid', bcc.isValidAddress(invalidHash));
//   //
//   // let raw;
//   // raw = await bcc.getBlock(validHash, false);
//   // // console.log('Valid', raw);
//   //
//   // raw = await bcc.getBlock(invalidHash, false);
//   // // console.log('Invalid', raw);
//
//   // const hexaddr = '1422921d01e9189609cde5b4bf8120cb431bfded07';
//
//   // const addrBuf = Buffer.from(hexaddr.slice(3), 'hex');
//   // const address = bcoin.address.fromRaw(addrBuf);
//   // console.log('OIWJEFOIWJEFO', address);
// })();
