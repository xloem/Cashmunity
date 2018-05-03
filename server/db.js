const Sequelize = require('sequelize');
const sequelize = new Sequelize('sqlite:tests/database.db');

// const sequelize = new Sequelize(postgres_database, postgres_user, postgres_password, {
//   dialect:  'postgres',
//   protocol: 'postgres',
//   port:     postgres_port,
//   host:     postgres_address,
//   // logging:  false,
//   // pool: {
//   //   max: 5,
//   //   min: 0,
//   //   idle: 10000,
//   // },
// })

// Models
const Follow = sequelize.import(__dirname + '/models/follow.js');
const Unfollow = sequelize.import(__dirname + '/models/unfollow.js');
const Like = sequelize.import(__dirname + '/models/like.js');
const Message = sequelize.import(__dirname + '/models/message.js');
const Name = sequelize.import(__dirname + '/models/name.js');
const Reply = sequelize.import(__dirname + '/models/reply.js');
const Settings = sequelize.import(__dirname + '/models/settings.js');

module.exports = {
  Follow,
  Unfollow,
  Like,
  Name,
  Message,
  Reply,
  Settings,
  sequelize: sequelize,
};
