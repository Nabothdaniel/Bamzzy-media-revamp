import Cart from '../models/Cart.js';
import User from '../models/User.js';
import { Account } from '../models/Account.js';
import PurchasedAccountFn from '../models/PurchasedAccount.js';
import TransactionFn from '../models/Transaction.js';
import { generateTransactionId } from '../utils/helperfns.js';
import sequelize from '../utils/database.js';

// Initialize models directly from their definition functions
const Transaction = TransactionFn(sequelize);
const PurchasedAccount = PurchasedAccountFn(sequelize);

// 👇 Associate Transaction with User manually
Transaction.associate({ User }); // Important!

User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' }); // Optional but useful


const createTransactions = async (req, res) => {
  try {
    const user = req.user;

    const cartItems = await Cart.findAll({
      where: { userId: user.id, isSold: false },
      include: [{ model: Account }]
    });

    if (!cartItems.length) {
      return res.status(400).json({ message: 'Cart is empty or already sold.' });
    }

    let totalPrice = 0;
    const transactionRecords = [];
    const purchasedAccounts = [];

    for (const item of cartItems) {
      const account = item.Account;
      const price = parseFloat(account.price) || 0;
      const transactionId = generateTransactionId();

      totalPrice += price;

      transactionRecords.push({
        transactionId,
        platform: account.platform,
        accountType: account.type,
        price,
        status: 'Delivered',
        date: new Date().toISOString().split('T')[0],
        userId: user.id
      });

      purchasedAccounts.push({
        platform: account.platform,
        accountType: account.type,
        login: account.loginDetails,
        password: account.password,
        price,
        userId: user.id,
        transactionId
      });

      await Account.update({ isSold: true }, { where: { id: account.id } });
    }

    // ✅ Subtract from user balance in DB
    const userInstance = await User.findByPk(user.id);
    if (userInstance.balance < totalPrice) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    userInstance.balance -= totalPrice;
    await userInstance.save();

    await Transaction.bulkCreate(transactionRecords);
    await PurchasedAccount.bulkCreate(purchasedAccounts);
    await Cart.update({ isSold: true }, { where: { userId: user.id, isSold: false } });

    const purchasedAccountIds = cartItems.map(item => item.accountId);

    await Cart.destroy({
      where: {
        userId: req.user.id,
        accountId: purchasedAccountIds
      }
    });


    return res.status(201).json({
      message: 'Transaction complete',
      transactionRecords,
      purchasedAccounts,
      newBalance: userInstance.balance
    });

  } catch (error) {
    console.error('Transaction Error:', error);
    res.status(500).json({ message: 'Transaction failed' });
  }
};

const getPurchasedAccounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const purchasedAccounts = await PurchasedAccount.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    return res.json({ success: true, accounts: purchasedAccounts });
  } catch (error) {
    console.error('Error fetching purchased accounts:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch purchased accounts' });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      include: {
        model: User,
        as: 'user', // MUST match 'as' from .belongsTo
        attributes: ['id', 'name', 'email']
      },
      order: [['createdAt', 'DESC']]
    });


    return res.status(200).json({ success: true, transactions });
  } catch (error) {
    console.error("Get all transactions error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



export { createTransactions, getPurchasedAccounts, getAllTransactions }