const Sequelize = require('sequelize');
const sequelize = new Sequelize('sqlite:tests/database.db', {
  operatorsAliases: Sequelize.Op,
});

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
