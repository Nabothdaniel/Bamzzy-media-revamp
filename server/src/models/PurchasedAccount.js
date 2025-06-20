import { DataTypes } from 'sequelize';
import sequelize from '../utils/database.js';
import User from './User.js';
import Transaction from './Transaction.js';
import AccountCard from './AccountCard.js';

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
    type: DataTypes.ENUM('pending', 'completed', 'refunded', 'failed'),
    allowNull: false,
    defaultValue: 'completed',
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Transaction,
      key: 'transactionId',
    },
    onDelete: 'CASCADE',
  },
  accountCardId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: AccountCard,
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
}, {
  tableName: 'purchased_accounts',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['username', 'transactionId'],
    },
  ],
});

// 🔗 Associations
PurchasedAccount.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE',
});

PurchasedAccount.belongsTo(Transaction, {
  foreignKey: 'transactionId',
  targetKey: 'transactionId',
  as: 'transaction',
  onDelete: 'CASCADE',
});

PurchasedAccount.belongsTo(AccountCard, {
  foreignKey: 'accountCardId',
  as: 'card',
  onDelete: 'SET NULL',
});

export default PurchasedAccount;
