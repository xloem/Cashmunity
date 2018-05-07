module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Profile',
    {
      hash: {
        type: DataTypes.STRING,
        unique: true,
        primaryKey: true,
      },
      address: DataTypes.STRING,
      profile: DataTypes.STRING(512),
      height: DataTypes.BIGINT,
      mtime: DataTypes.BIGINT,
      protocol: DataTypes.ENUM('memo', 'blockpress'),
    },
    {
      tableName: 'profiles',
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
