import Cart from '../models/Cart.js';
import User from '../models/User.js';
import Account from '../models/Account.js';
import PurchasedAccount from '../models/PurchasedAccount.js';
import Transaction from '../models/Transaction.js';
import AccountCard from '../models/AccountCard.js';
import { generateTransactionId } from '../utils/helperfns.js';
import sequelize from '../utils/database.js';

const createTransactions = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const user = req.user;

    const cartItems = await Cart.findAll({
      where: { userId: user.id, isSold: false },
      include: [{ model: AccountCard, as: 'card' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!cartItems.length) {
      await t.rollback();
      return res.status(400).json({ message: 'Cart is empty or already sold.' });
    }

    const transactionRecords = [];
    const purchasedAccounts = [];
    let totalPrice = 0;

    for (const item of cartItems) {
      const quantity = item.quantity || 1;
      const card = item.card;

      if (!card) {
        await t.rollback();
        return res.status(400).json({ message: 'Account card not found in cart item.' });
      }

      const cardQuantity = parseInt(card.quantity);

      if (isNaN(cardQuantity) || cardQuantity < quantity) {
        await t.rollback();
        return res.status(400).json({
          message: `Not enough stock for ${card.platform} - ${card.category}`,
        });
      }

      const availableAccounts = await Account.findAll({
        where: {
          accountCardId: card.id,
          isSold: false,
        },
        limit: quantity,
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (availableAccounts.length < quantity) {
        await t.rollback();
        return res.status(400).json({
          message: `Not enough available accounts for ${card.platform} - ${card.category}`,
        });
      }

      for (const account of availableAccounts) {
        const price = parseFloat(card.price) || 0;
        const transactionId = generateTransactionId();

        totalPrice += price;

        transactionRecords.push({
          transactionId,
          userId: user.id,
          accountId: account.id,
          platform: card.platform,
          price,
          status: 'Delivered',
          type: 'purchase',
        });

        purchasedAccounts.push({
          userId: user.id,
          transactionId,
          platform: card.platform,
          category: card.category,
          username: account.username,
          password: account.password,
          twoFactor: account.twoFactor,
          mail: account.mail,
          mailPassword: account.mailPassword,
          description: card.description,
          price,
          status: 'completed',
        });

        await Account.update(
          { isSold: true },
          { where: { id: account.id }, transaction: t }
        );
      }

      // ✅ Deduct card quantity safely
      const newQuantity = cardQuantity - quantity;

      if (newQuantity < 0) {
        await t.rollback();
        return res.status(400).json({
          message: `Negative resulting quantity for ${card.platform} - ${card.category}`,
        });
      }

      await AccountCard.update(
        { quantity: newQuantity },
        { where: { id: card.id }, transaction: t }
      );
    }

    const clientTotal = parseFloat(req.body.totalPrice || 0);
    if (clientTotal !== totalPrice) {
      await t.rollback();
      return res.status(400).json({ message: 'Price mismatch. Please refresh cart.' });
    }

    const userInstance = await User.findByPk(user.id, { transaction: t });

    if (userInstance.balance < totalPrice) {
      await t.rollback();
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    await Transaction.bulkCreate(transactionRecords, { transaction: t });
    await PurchasedAccount.bulkCreate(purchasedAccounts, { transaction: t });

    await Cart.destroy({
      where: { userId: user.id, isSold: false },
      transaction: t,
    });

    userInstance.balance -= totalPrice;
    await userInstance.save({ transaction: t });

    await t.commit();

    return res.status(201).json({
      message: 'Transaction complete',
      newBalance: userInstance.balance,
    });
  } catch (error) {
    await t.rollback();
    console.error('Transaction Error:', error);
    return res.status(500).json({ message: 'Transaction failed' });
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
        as: 'user',
        attributes: ['id', 'name', 'email']
      },
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ success: true, transactions });
  } catch (error) {
    console.error('Get all transactions error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export { createTransactions, getPurchasedAccounts, getAllTransactions };
