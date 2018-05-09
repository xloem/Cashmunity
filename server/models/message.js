module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Message',
    {
      hash: {
        type: DataTypes.STRING(64),
        unique: true,
        primaryKey: true,
      },
      height: DataTypes.BIGINT,
      mtime: DataTypes.BIGINT,
      address: DataTypes.STRING(35),
      replytx: DataTypes.STRING(64),
      roottx: DataTypes.STRING(64),
      type: DataTypes.ENUM('reserved', 'img', 'unknown'),
      media: DataTypes.STRING(440),
      msg: DataTypes.STRING(440),
      topic: DataTypes.STRING(440),
      protocol: DataTypes.ENUM('memo', 'blockpress'),
    },
    {
      tableName: 'messages',
      timestamps: false,
      indexes: [
        {
          // unique: true,
          fields: ['hash', 'address', 'replytx', 'roottx', 'topic'],
        },
      ],
    }
  );
};
