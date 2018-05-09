module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Like',
    {
      hash: {
        type: DataTypes.STRING(64),
        unique: true,
        primaryKey: true,
      },
      address: DataTypes.STRING(35),
      liketx: DataTypes.STRING(64),
      tip: DataTypes.BIGINT,
      height: DataTypes.BIGINT,
      mtime: DataTypes.BIGINT,
      protocol: DataTypes.ENUM('memo', 'blockpress'),
    },
    {
      tableName: 'likes',
      timestamps: false,
      indexes: [
        {
          // unique: true,
          fields: ['liketx', 'address'],
        },
      ],
    }
  );
};
