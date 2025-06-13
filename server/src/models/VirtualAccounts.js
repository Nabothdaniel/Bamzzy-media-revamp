import { DataTypes } from 'sequelize';
import sequelize from '../utils/database.js';

  const VirtualAccount = sequelize.define('VirtualAccount', {
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    accountName: {
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
    tableName: 'virtualaccounts',
  });

  VirtualAccount.associate = (models) => {
    VirtualAccount.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };


export  {VirtualAccount};
