module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Name',
    {
      hash: {
        type: DataTypes.STRING(64),
        unique: true,
        primaryKey: true,
      },
      address: DataTypes.STRING(35),
      name: DataTypes.STRING(440),
      height: DataTypes.BIGINT,
      mtime: DataTypes.BIGINT,
      protocol: DataTypes.ENUM('memo', 'blockpress'),
    },
    {
      tableName: 'names',
      timestamps: false,
      indexes: [
        {
          // unique: true,
          fields: ['name', 'address'],
        },
      ],
    }
  );
};
