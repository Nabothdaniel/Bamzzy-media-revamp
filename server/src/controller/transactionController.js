import Cart from '../models/Cart.js';
import User from '../models/User.js';
import { Account } from '../models/Account.js';
import PurchasedAccount from '../models/PurchasedAccount.js';
import Transaction from '../models/Transaction.js'
import { generateTransactionId } from '../utils/helperfns.js';


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

      // Transaction record (keep all fields)
      transactionRecords.push({
        id: transactionId,
        userId: user.id,
        accountId: account.id,
        platform: account.platform,
        category: account.category,
        price: price,
        username: account.username,
        password: account.password,
        twoFactor: account.twoFactor,
        mail: account.mail,
        mailPassword: account.mailPassword,
        description: account.description,
        status: 'completed'
      });

      // Purchased account record (optional to expand further)
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
        status:"completed"
      });

      // Mark account as sold
      await Account.update({ isSold: true }, { where: { id: account.id } });
    }

    // Check user balance
    const userInstance = await User.findByPk(user.id);
    if (userInstance.balance < totalPrice) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Deduct balance and save
    userInstance.balance -= totalPrice;
    await userInstance.save();

    // Create transaction & purchased account records
    await Transaction.bulkCreate(transactionRecords);
    await PurchasedAccount.bulkCreate(purchasedAccounts);

    // Mark all cart items as sold
    await Cart.update({ isSold: true }, { where: { userId: user.id, isSold: false } });

    // Remove sold items from cart
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