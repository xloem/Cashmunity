const Sequelize = require('sequelize');
const {
  DB_DIALECT,
  DB_DATABASE,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_PROTOCOL,
} = require('./config');

let sequelize;
if (DB_DIALECT && DB_DIALECT !== 'sqlite') {
  sequelize = new Sequelize(DB_DATABASE, DB_USER, DB_PASSWORD, {
    dialect: DB_DIALECT,
    protocol: DB_PROTOCOL,
    port: DB_PORT,
    host: DB_HOST,
    // logging:  false,
    // pool: {
    //   max: 5,
    //   min: 0,
    //   idle: 10000,
    // },
  });
} else {
  sequelize = new Sequelize('sqlite:db/database.db', {
    operatorsAliases: Sequelize.Op,
    logging: false,
  });
}

// Models
const Follow = sequelize.import(__dirname + '/models/follow.js');
const Like = sequelize.import(__dirname + '/models/like.js');
const Message = sequelize.import(__dirname + '/models/message.js');
const Name = sequelize.import(__dirname + '/models/name.js');
const Profile = sequelize.import(__dirname + '/models/profile.js');
const Avatar = sequelize.import(__dirname + '/models/avatar.js');
const Header = sequelize.import(__dirname + '/models/header.js');
const Settings = sequelize.import(__dirname + '/models/settings.js');

module.exports = {
  Follow,
  Like,
  Name,
  Profile,
  Message,
  Settings,
  Avatar,
  Header,
  Sequelize,
  sequelize,
};
