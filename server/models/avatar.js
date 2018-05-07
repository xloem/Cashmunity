module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Avatar',
    {
      hash: {
        type: DataTypes.STRING,
        unique: true,
        primaryKey: true,
      },
      address: DataTypes.STRING,
      avatar: DataTypes.STRING(512),
      height: DataTypes.BIGINT,
      mtime: DataTypes.BIGINT,
      protocol: DataTypes.ENUM('memo', 'blockpress'),
    },
    {
      tableName: 'avatars',
      timestamps: false,
      indexes: [
        {
          // unique: true,
          fields: ['address'],
        },
      ],
    }
  );
};
