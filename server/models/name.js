module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Name',
    {
      hash: {
        type: DataTypes.STRING,
        unique: true,
        primaryKey: true,
      },
      address: DataTypes.STRING,
      name: DataTypes.STRING,
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
