module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Message',
    {
      hash: {
        type: DataTypes.STRING,
        unique: true,
        primaryKey: true,
      },
      msg: DataTypes.STRING(512),
      address: DataTypes.STRING,
      replytx: DataTypes.STRING,
      height: DataTypes.BIGINT,
      mtime: DataTypes.BIGINT,
    },
    {
      tableName: 'messages',
      timestamps: false,
      indexes: [
        {
          // unique: true,
          fields: ['hash', 'address'],
        },
      ],
    }
  );
};
