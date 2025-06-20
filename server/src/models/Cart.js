import { Model, DataTypes } from 'sequelize';
import sequelize from '../utils/database.js';

class Cart extends Model { }

Cart.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  accountCardId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
  },
  isSold: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  sequelize,
  modelName: 'Cart',
  tableName: 'Carts',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'accountCardId', 'isSold'],
    },
  ],
});

export const associateCart = (models) => {
  Cart.belongsTo(models.User, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
  });

  Cart.belongsTo(models.AccountCard, {
    foreignKey: 'accountCardId',
    as: 'card',
    onDelete: 'CASCADE',
  });

  models.User.hasMany(Cart, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
  });

  models.AccountCard.hasMany(Cart, {
    foreignKey: 'accountCardId',
    onDelete: 'CASCADE',
  });
};

export default Cart;
