const DB = require('./db');
const {
  Models: { Message, Like, Name, Avatar, Header, Profile, Follow },
} = DB;
const Op = DB.Sequelize.Op;

const DEFAULT_LIMIT = 200;

class Query {
  async messages({ address, page = 0 }) {
    const messages = await Message.findAll({
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
        'media',
        'type',
      ],
      limit: DEFAULT_LIMIT,
      offset: DEFAULT_LIMIT * page,
      order: [['height', 'DESC'], ['mtime', 'DESC']],
    });
    return {
      messages,
    };
  }
  async replies({ txid, page = 0 }) {
    const replies = await Message.findAll({
      where: {
        [Op.or]: {
          replytx: txid,
          roottx: txid,
          hash: txid,
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
      order: [['height', 'DESC'], ['mtime', 'DESC']],
    });
    return {
      replies,
    };
  }
  async likes({ address, page = 0 }) {
    const likes = await Like.findAll({
      where: {
        address,
      },
      raw: true,
      attributes: ['hash', 'liketx', 'tip', 'height', 'mtime', 'protocol'],
      limit: DEFAULT_LIMIT,
      offset: DEFAULT_LIMIT * page,
      order: [['height', 'DESC'], ['mtime', 'DESC']],
    });
    return {
      likes,
    };
  }
  async name({ address }) {
    const name = await Name.findOne({
      where: {
        address,
      },
      raw: true,
      attributes: ['name', 'protocol'],
      order: [['height', 'DESC'], ['mtime', 'DESC']],
    });
    const profile = await Profile.findOne({
      where: { address },
      raw: true,
      attributes: ['profile'],
      order: [['height', 'DESC'], ['mtime', 'DESC']],
    });
    const avatar = await Avatar.findOne({
      where: { address },
      raw: true,
      attributes: ['avatar'],
      order: [['height', 'DESC'], ['mtime', 'DESC']],
    });
    const header = await Header.findOne({
      where: { address },
      raw: true,
      attributes: ['header'],
      order: [['height', 'DESC'], ['mtime', 'DESC']],
    });
    return { ...avatar, ...header, ...profile, ...name };
  }
  async allNames({ addresses }) {
    const names = await Name.findAll({
      where: {
        address: addresses,
      },
      raw: true,
      attributes: ['name', 'address', 'protocol'],
      order: [['height', 'ASC'], ['mtime', 'ASC']],
    });
    const returnNames = {};
    for (const name of names) {
      returnNames[name.address] = name.name;
    }
    return returnNames;
  }
  async follows({ address }) {
    const follows = await Follow.findAll({
      where: {
        address,
      },
      raw: true,
      attributes: ['follow', 'unfollow', 'protocol'],
      order: [['height', 'DESC'], ['mtime', 'DESC']],
    });
    const followMap = {};
    for (const follow of follows) {
      followMap[follow.follow] = follow.unfollow ? undefined : true;
    }
    return followMap;
  }
  async feed({ address, page = 0 }) {
    const follows = await this.follows({ address });
    const messages = await Message.findAll({
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
        'media',
        'type',
      ],
      limit: DEFAULT_LIMIT,
      offset: DEFAULT_LIMIT * page,
      order: [['height', 'DESC'], ['mtime', 'DESC']],
    });
    return { messages };
  }
  async all({ page = 0 }) {
    const messages = await Message.findAll({
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
        'media',
        'type',
      ],
      limit: DEFAULT_LIMIT,
      offset: DEFAULT_LIMIT * page,
      order: [['height', 'DESC'], ['mtime', 'DESC']],
    });
    const temp = {};
    messages.map(message => {
      temp[message.address] = true;
    });
    const names = await this.allNames({ addresses: Object.keys(temp) });
    return { messages, names };
  }
}

module.exports = Query;
