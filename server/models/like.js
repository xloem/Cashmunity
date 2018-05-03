module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Like',
    {
      hash: {
        type: DataTypes.STRING,
        unique: true,
        primaryKey: true,
      },
      address: DataTypes.STRING,
      liketx: DataTypes.STRING,
      tip: DataTypes.BIGINT,
      height: DataTypes.BIGINT,
      mtime: DataTypes.BIGINT,
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
