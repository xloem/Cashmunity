module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Header',
    {
      hash: {
        type: DataTypes.STRING,
        unique: true,
        primaryKey: true,
      },
      address: DataTypes.STRING,
      header: DataTypes.STRING(512),
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
