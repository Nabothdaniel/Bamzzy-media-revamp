import { DataTypes } from 'sequelize';
import sequelize from '../utils/database.js';
import User from './User.js';
import Transaction from './Transaction.js';

const PurchasedAccount = sequelize.define('PurchasedAccount', {
  platform: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  twoFactor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mailPassword: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'purchased_accounts',
  timestamps: true,
});

// 🔗 Associations (defined directly here to match your Transaction.js style)
PurchasedAccount.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE',
});

PurchasedAccount.belongsTo(Transaction, {
  foreignKey: 'transactionId',
  targetKey: 'transactionId', // Match non-default primary key
  as: 'transaction',
  onDelete: 'CASCADE',
});

export default PurchasedAccount;
