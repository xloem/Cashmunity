module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Profile',
    {
      hash: {
        type: DataTypes.STRING(64),
        unique: true,
        primaryKey: true,
      },
      address: DataTypes.STRING(35),
      profile: DataTypes.STRING(440),
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
