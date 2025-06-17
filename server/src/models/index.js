// models/index.js
import sequelize from '../utils/database.js';
import TransactionFactory from './Transaction.js';
import UserFactory from './User.js';

const models = {};

models.User = UserFactory(sequelize);
models.Transaction = TransactionFactory(sequelize);
// ...initialize other models here

// run associations
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = sequelize;

export default models;
