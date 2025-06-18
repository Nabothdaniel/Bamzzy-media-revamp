// models/Message.js
import { DataTypes } from 'sequelize';
import sequelize from '../utils/database.js';
import User from './User.js'; 

const Message = sequelize.define('Message', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users', 
      key: 'id',
    },
    onDelete: 'CASCADE', 
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isRead: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
},
}, {
  tableName: 'messages',
  timestamps: true,
});

Message.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Message, { foreignKey: 'userId', as: 'messages' });

export default Message;
