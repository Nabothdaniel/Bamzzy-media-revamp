import { DataTypes } from 'sequelize';
import sequelize from '../utils/database.js';

const Account = sequelize.define('Account', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
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
  isSold: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users', 
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  accountCardId: {
  type: DataTypes.INTEGER,
  allowNull: false,
  references: {
    model: 'account_cards', // Use table name instead of model reference
    key: 'id',
  },
  onDelete: 'CASCADE',
},
}, {
  tableName: 'accounts',
  timestamps: true,
});

// Associations
export const accountAssociation = (models) => {
Account.belongsTo(models.User, { foreignKey: 'adminId', as: 'admin' }); 
  Account.belongsTo(models.AccountCard, { foreignKey: 'accountCardId', as: 'card' });
};


export default Account;
