const Sequelize = require('sequelize');
const {
  DB_DISABLE,
  DB_DIALECT,
  DB_DATABASE,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_PROTOCOL,
} = require('./config');

let sequelize;
let Settings;
let Models = {};

if (!DB_DISABLE) {
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
  Models = {
    Follow: sequelize.import(__dirname + '/models/follow.js'),
    Like: sequelize.import(__dirname + '/models/like.js'),
    Message: sequelize.import(__dirname + '/models/message.js'),
    Name: sequelize.import(__dirname + '/models/name.js'),
    Profile: sequelize.import(__dirname + '/models/profile.js'),
    Avatar: sequelize.import(__dirname + '/models/avatar.js'),
    Header: sequelize.import(__dirname + '/models/header.js'),
  };
  Settings = sequelize.import(__dirname + '/models/settings.js');
} else {
  console.log('!!!!!!!! Database is Disabled !!!!!!!!!');
}

module.exports = {
  Models,
  Settings,
  Sequelize,
  sequelize,
};
