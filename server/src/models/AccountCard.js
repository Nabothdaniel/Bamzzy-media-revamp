import { DataTypes } from 'sequelize';
import sequelize from '../utils/database.js';

const AccountCard = sequelize.define('account_cards', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  platform: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    }
  },
}, {
  tableName: 'account_cards',
  timestamps: true,
});

export const associateAccountCard = (models) => {
  AccountCard.belongsTo(models.User, {
    foreignKey: 'adminId',
    as: 'admin',
    onDelete: 'CASCADE',
  });

  AccountCard.hasMany(models.Account, {
    foreignKey: 'accountCardId',
    as: 'accounts',
  });

  AccountCard.hasMany(models.Cart, {
    foreignKey: 'accountCardId',
    as: 'cartItems',
    onDelete: 'CASCADE',
  });
};

export default AccountCard;
