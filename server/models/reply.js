module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Reply',
    {
      hash: {
        type: DataTypes.STRING,
        unique: true,
        primaryKey: true,
      },
      address: DataTypes.STRING,
      replytx: DataTypes.STRING,
      msg: DataTypes.STRING(512),
      height: DataTypes.BIGINT,
      mtime: DataTypes.BIGINT,
    },
    {
      tableName: 'replies',
      timestamps: false,
      indexes: [
        {
          // unique: true,
          fields: ['replytx', 'address'],
        },
      ],
    }
  );
};
