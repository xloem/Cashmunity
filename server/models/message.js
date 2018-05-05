module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Message',
    {
      hash: {
        type: DataTypes.STRING,
        unique: true,
        primaryKey: true,
      },
      height: DataTypes.BIGINT,
      mtime: DataTypes.BIGINT,
      address: DataTypes.STRING,
      replytx: DataTypes.STRING,
      roottx: DataTypes.STRING,
      msg: DataTypes.STRING(512),
      topic: DataTypes.STRING(512),
    },
    {
      tableName: 'messages',
      timestamps: false,
      indexes: [
        {
          // unique: true,
          fields: ['hash', 'address', 'replytx', 'roottx'],
        },
      ],
    }
  );
};
