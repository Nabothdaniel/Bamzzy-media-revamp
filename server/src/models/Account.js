// models/Account.js
import { DataTypes } from 'sequelize';
import sequelize  from '../utils/database.js';
import  User  from './User.js';  // import User model

const Account = sequelize.define('Account', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  platform: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  loginDetails: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  followers: {
  type: DataTypes.INTEGER, // or STRING if it's stored as text
  allowNull: true
},
  howToUse: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'available',
  },
  isSold: {
  type: DataTypes.BOOLEAN,
  defaultValue: false
},
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'accounts',
  timestamps: true,
});

// Associations
Account.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });
User.hasMany(Account, { foreignKey: 'adminId', as: 'accounts' });
export { Account };
