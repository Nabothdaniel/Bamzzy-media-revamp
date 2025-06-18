import { DataTypes } from 'sequelize';
import sequelize from '../utils/database.js';
import User from './User.js'; // Import User directly here

const Transaction = sequelize.define('Transaction', {
  transactionId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  accountId: {
    type: DataTypes.INTEGER, 
    allowNull: true, 
  },
  type: {
    type: DataTypes.STRING, // 'fund' or 'purchase'
    allowNull: false,
  },
  platform: {
    type: DataTypes.STRING, // 'fund' or 'purchase'
    allowNull: true,
  },
   status: {
    type: DataTypes.STRING, // 'fund' or 'purchase'
    allowNull: false,
  },
}, {
  tableName: 'transactions',
  timestamps: true,
});

// ✅ Define association directly here (without needing models object)
Transaction.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE',
});

export default Transaction;
