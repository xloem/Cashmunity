module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Follow',
    {
      hash: {
        type: DataTypes.STRING,
        unique: true,
        primaryKey: true,
      },
      address: DataTypes.STRING,
      follow: DataTypes.STRING,
      height: DataTypes.BIGINT,
      mtime: DataTypes.BIGINT,
    },
    {
      tableName: 'follows',
      timestamps: false,
      indexes: [
        {
          // unique: true,
          fields: ['follow', 'address'],
        },
      ],
    }
  );
};
