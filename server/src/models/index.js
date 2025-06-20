import sequelize from '../utils/database.js';

import User, { associateUser } from './User.js';
import AccountCard, { associateAccountCard } from './AccountCard.js';
import Cart, { associateCart } from './Cart.js';
import Account, { accountAssociation} from './Account.js'; // Optional if used

// Collect all models
const models = {
  User,
  AccountCard,
  Cart,
  Account, // if needed
};

// Call all associate functions **AFTER** models are registered
associateUser(models);
associateAccountCard(models);
associateCart(models);
accountAssociation(models); 

export { sequelize };
export default models;
