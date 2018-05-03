module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Settings',
    {
      height: DataTypes.BIGINT,
    },
    {
      tableName: 'settings',
      timestamps: true,
    }
  );
};
