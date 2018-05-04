module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Settings',
    {
      name: {
        type: DataTypes.STRING,
        unique: true,
        primaryKey: true,
      },
      height: DataTypes.BIGINT,
    },
    {
      tableName: 'settings',
      timestamps: true,
    }
  );
};
