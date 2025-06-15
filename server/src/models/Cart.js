import { Model, DataTypes } from 'sequelize';
import sequelize from '../utils/database.js';
import User from './User.js';
import { Account } from './Account.js';

class Cart extends Model { }

Cart.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  accountId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false
  },
  isSold: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  sequelize,
  modelName: 'Cart',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'accountId']
    }
  ]
});


// Associations
User.hasMany(Cart, { foreignKey: 'userId', onDelete: 'CASCADE' });
Cart.belongsTo(User, { foreignKey: 'userId' });

Account.hasMany(Cart, { foreignKey: 'accountId', onDelete: 'CASCADE' });
Cart.belongsTo(Account, { foreignKey: 'accountId' });

export default Cart;
