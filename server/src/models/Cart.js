import { Model, DataTypes } from 'sequelize';
import sequelize from '../utils/database.js';
import User from './User.js';
import {Account} from './Account.js';

class Cart extends Model {}

Cart.init({
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Cart'
});

// Associations
User.hasMany(Cart, { foreignKey: 'userId', onDelete: 'CASCADE' });
Cart.belongsTo(User, { foreignKey: 'userId' });

Account.hasMany(Cart, { foreignKey: 'accountId', onDelete: 'CASCADE' });
Cart.belongsTo(Account, { foreignKey: 'accountId' });

export default Cart;
