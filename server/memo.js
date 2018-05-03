const DB = require('./db');
const Op = DB.Sequelize.Op;
const Worker = require('./worker');
const worker = new Worker();

const DEFAULT_LIMIT = 100;

class Memo {
  constructor() {
    // worker.sync();
  }

  async messages({ address, height }) {
    const messages = await DB.Message.findAll({
      where: {
        address,
        height: {
          [Op.lt]: height || Number.MAX_SAFE_INTEGER,
        },
      },
      raw: true,
      attributes: ['hash', 'msg', 'height'],
      limit: DEFAULT_LIMIT,
      order: [['height', 'DESC']],
    });
    return {
      messages,
    };
  }
  async replies({ replytx, height }) {
    const replies = await DB.Reply.findAll({
      where: {
        replytx,
        height: {
          [Op.lt]: height || Number.MAX_SAFE_INTEGER,
        },
      },
      raw: true,
      attributes: ['hash', 'msg', 'height'],
      limit: DEFAULT_LIMIT,
      order: [['height', 'DESC']],
    });
    return {
      replies,
    };
  }
  async likes({ address, height }) {
    const likes = await DB.Like.findAll({
      where: {
        address,
        height: {
          [Op.lt]: height || Number.MAX_SAFE_INTEGER,
        },
      },
      raw: true,
      attributes: ['hash', 'liketx', 'tip', 'height'],
      limit: DEFAULT_LIMIT,
      order: [['height', 'DESC']],
    });
    return {
      likes,
    };
  }
  async name({ address }) {
    const names = await DB.Name.findAll({
      where: {
        address,
      },
      raw: true,
      attributes: ['name', 'height'],
      limit: 1,
      order: [['height', 'DESC']],
    });
    return names.length > 0 ? names[0] : {};
  }
  async follows({ address }) {
    const follows = await DB.Follow.findAll({
      where: {
        address,
      },
      raw: true,
      attributes: ['follow', 'unfollow'],
      order: [['height', 'ASC']],
    });
    const followMap = {};
    follows.map(follow => {
      followMap[follow.follow] = follow.unfollow ? undefined : true;
    });
    return followMap;
  }
  async feed({ address, height }) {
    const follows = await this.follows({ address });
    const messages = await DB.Message.findAll({
      where: {
        address: [address, ...Object.keys(follows)],
        height: {
          [Op.lt]: height || Number.MAX_SAFE_INTEGER,
        },
      },
      raw: true,
      attributes: ['hash', 'msg', 'height'],
      limit: DEFAULT_LIMIT,
      order: [['height', 'DESC']],
    });
    return { messages };
  }
}

module.exports = Memo;
