import { DataTypes } from 'sequelize';

const Transaction = (sequelize) => {
  const TransactionModel = sequelize.define('transactions', {
    transactionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    platform: DataTypes.STRING,
    accountType: DataTypes.STRING,
    price: DataTypes.FLOAT,
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Delivered'
    },
    date: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  });

  TransactionModel.associate = ({ User }) => {
    TransactionModel.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return TransactionModel;
};

export default Transaction;
