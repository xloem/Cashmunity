module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Unfollow',
    {
      hash: {
        type: DataTypes.STRING,
        unique: true,
        primaryKey: true,
      },
      address: DataTypes.STRING,
      unfollow: DataTypes.STRING,
      height: DataTypes.BIGINT,
      mtime: DataTypes.BIGINT,
    },
    {
      tableName: 'unfollows',
      timestamps: false,
      indexes: [
        {
          // unique: true,
          fields: ['unfollow', 'address'],
        },
      ],
    }
  );
};
