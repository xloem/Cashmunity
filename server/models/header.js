module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Header',
    {
      hash: {
        type: DataTypes.STRING(64),
        unique: true,
        primaryKey: true,
      },
      address: DataTypes.STRING(35),
      header: DataTypes.STRING(440),
      height: DataTypes.BIGINT,
      mtime: DataTypes.BIGINT,
      protocol: DataTypes.ENUM('memo', 'blockpress'),
    },
    {
      tableName: 'headers',
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
