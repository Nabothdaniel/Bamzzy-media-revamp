import { DataTypes } from 'sequelize';
import sequelize from '../utils/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: DataTypes.STRING,
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: DataTypes.STRING,
  balance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  }
}, {
  tableName: 'users',
  timestamps: true
});

export const associateUser = (models) => {
  User.hasMany(models.AccountCard, { foreignKey: 'adminId', as: 'accountCards' });
  User.hasMany(models.Cart, { foreignKey: 'userId' });
};


export default User;
