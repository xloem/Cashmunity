const DB = require('./db');
const Op = DB.Sequelize.Op;

const DEFAULT_LIMIT = 200;

class Memo {
  constructor() {}

  async messages({ address, page = 0 }) {
    const messages = await DB.Message.findAll({
      where: {
        address,
      },
      raw: true,
      attributes: [
        'hash',
        'msg',
        'height',
        'replytx',
        'roottx',
        'mtime',
        'topic',
        'protocol',
      ],
      limit: DEFAULT_LIMIT,
      offset: DEFAULT_LIMIT * page,
      order: [['height', 'DESC']],
    });
    return {
      messages,
    };
  }
  async replies({ tx, page = 0 }) {
    const replies = await DB.Message.findAll({
      where: {
        [Op.or]: {
          replytx: tx,
          roottx: tx,
          hash: tx,
        },
      },
      raw: true,
      attributes: [
        'hash',
        'msg',
        'address',
        'height',
        'replytx',
        'roottx',
        'mtime',
        'topic',
        'protocol',
      ],
      limit: DEFAULT_LIMIT,
      offset: DEFAULT_LIMIT * page,
      order: [['height', 'DESC']],
    });
    return {
      replies,
    };
  }
  async likes({ address, page = 0 }) {
    const likes = await DB.Like.findAll({
      where: {
        address,
      },
      raw: true,
      attributes: ['hash', 'liketx', 'tip', 'height', 'mtime', 'protocol'],
      limit: DEFAULT_LIMIT,
      offset: DEFAULT_LIMIT * page,
      order: [['height', 'DESC']],
    });
    return {
      likes,
    };
  }
  async name({ address }) {
    const name = await DB.Name.findOne({
      where: {
        address,
      },
      raw: true,
      attributes: ['name', 'protocol'],
      order: [['height', 'DESC']],
    });
    const profile = await DB.Profile.findOne({
      where: { address },
      raw: true,
      attributes: ['profile'],
      order: [['height', 'DESC']],
    });
    return { ...name, ...profile };
  }
  async allNames({ addresses }) {
    const names = await DB.Name.findAll({
      where: {
        address: addresses,
      },
      raw: true,
      attributes: ['name', 'address', 'protocol'],
      order: [['height', 'ASC']],
    });
    const returnNames = {};
    names.map(name => {
      returnNames[name.address] = name.name;
    });
    return returnNames;
  }
  async follows({ address }) {
    const follows = await DB.Follow.findAll({
      where: {
        address,
      },
      raw: true,
      attributes: ['follow', 'unfollow', 'protocol'],
      order: [['height', 'ASC']],
    });
    const followMap = {};
    follows.map(follow => {
      followMap[follow.follow] = follow.unfollow ? undefined : true;
    });
    return followMap;
  }
  async feed({ address, page = 0 }) {
    const follows = await this.follows({ address });
    const messages = await DB.Message.findAll({
      where: {
        address: [address, ...Object.keys(follows)],
      },
      raw: true,
      attributes: [
        'hash',
        'msg',
        'height',
        'mtime',
        'replytx',
        'roottx',
        'topic',
        'protocol',
      ],
      limit: DEFAULT_LIMIT,
      offset: DEFAULT_LIMIT * page,
      order: [['height', 'DESC']],
    });
    return { messages };
  }
  async top({ page = 0 }) {
    const messages = await DB.Message.findAll({
      raw: true,
      attributes: [
        'hash',
        'msg',
        'address',
        'height',
        'replytx',
        'roottx',
        'topic',
        'mtime',
        'protocol',
      ],
      limit: DEFAULT_LIMIT,
      offset: DEFAULT_LIMIT * page,
      order: [['height', 'DESC']],
    });
    const temp = {};
    messages.map(message => {
      temp[message.address] = true;
    });
    const names = await this.allNames({ addresses: Object.keys(temp) });
    return { messages, names };
  }
}

module.exports = Memo;
