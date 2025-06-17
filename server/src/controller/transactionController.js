import Cart from '../models/Cart.js';
import User from '../models/User.js';
import { Account } from '../models/Account.js';
import PurchasedAccount from '../models/PurchasedAccount.js';
import Transaction from '../models/Transaction.js'
import { generateTransactionId } from '../utils/helperfns.js';


import sequelize from '../utils/database.js'; // adjust the path to your Sequelize instance

const createTransactions = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const user = req.user;

    const cartItems = await Cart.findAll({
      where: { userId: user.id, isSold: false },
      include: [{ model: Account }],
      transaction: t
    });

    if (!cartItems.length) {
      await t.rollback();
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
        userId: user.id,
        amount: price,
        type: 'purchase'
      });

      purchasedAccounts.push({
        userId: user.id,
        transactionId,
        platform: account.platform,
        category: account.category,
        username: account.username,
        password: account.password,
        twoFactor: account.twoFactor,
        mail: account.mail,
        mailPassword: account.mailPassword,
        description: account.description,
        price,
        status: 'completed'
      });

      await Account.update({ isSold: true }, { where: { id: account.id }, transaction: t });
    }

    const userInstance = await User.findByPk(user.id, { transaction: t });

    if (userInstance.balance < totalPrice) {
      await t.rollback();
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    await Transaction.bulkCreate(transactionRecords, { transaction: t });
    await PurchasedAccount.bulkCreate(purchasedAccounts, { transaction: t });

    await Cart.update(
      { isSold: true },
      { where: { userId: user.id, isSold: false }, transaction: t }
    );

    const purchasedAccountIds = cartItems.map(item => item.accountId);
    await Cart.destroy({
      where: { userId: user.id, accountId: purchasedAccountIds },
      transaction: t
    });

    // ✅ Deduct balance only after everything succeeds
    userInstance.balance -= totalPrice;
    await userInstance.save({ transaction: t });

    await t.commit();

    return res.status(201).json({
      message: 'Transaction complete',
      transactionRecords,
      purchasedAccounts,
      newBalance: userInstance.balance
    });

  } catch (error) {
    await t.rollback();
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