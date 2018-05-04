const DB = require('./db');
const Op = DB.Sequelize.Op;

const DEFAULT_LIMIT = 200;

class Memo {
  constructor() {}

  async messages({ address, height }) {
    const messages = await DB.Message.findAll({
      where: {
        address,
        height: {
          [Op.lt]: height || Number.MAX_SAFE_INTEGER,
        },
      },
      raw: true,
      attributes: ['hash', 'msg', 'height', 'replytx'],
      limit: DEFAULT_LIMIT,
      order: [['height', 'DESC']],
    });
    return {
      messages,
    };
  }
  async replies({ replytx, height }) {
    const replies = await DB.Message.findAll({
      where: {
        replytx,
        height: {
          [Op.lt]: height || Number.MAX_SAFE_INTEGER,
        },
      },
      raw: true,
      attributes: ['hash', 'msg', 'address', 'height', 'replytx'],
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
  async top({ height }) {
    const messages = await DB.Message.findAll({
      where: {
        height: {
          [Op.lt]: height || Number.MAX_SAFE_INTEGER,
        },
      },
      raw: true,
      attributes: ['hash', 'msg', 'address', 'height'],
      limit: DEFAULT_LIMIT,
      order: [['height', 'DESC']],
    });
    return { messages };
  }
}

module.exports = Memo;
