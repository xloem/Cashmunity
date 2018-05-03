const DB = require('./db');
const Worker = require('./worker');
const worker = new Worker();

class Memo {
  constructor() {
    worker.sync();
  }

  async messages({ address }) {
    const messages = await DB.Message.findAll({
      where: { address }, raw: true
    });
    return {
      messages,
    };
  }
}

module.exports = Memo;
