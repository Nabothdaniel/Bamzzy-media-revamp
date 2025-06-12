import { DataTypes } from 'sequelize';

const VirtualAccount = (sequelize) => {
  const Account = sequelize.define('VirtualAccount', {
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bankCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'VirtualAccounts',
  });

  Account.associate = (models) => {
    Account.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return Account;
};

export  {VirtualAccount};
