

import Cart from '../models/Cart.js';
import { Account } from '../models/Account.js';

const addToCart = async (req, res) => {
  try {
    const { accountId } = req.body;
    const userId = req.user.id;

    // Check if account exists and is available
    const account = await Account.findOne({ where: { id: accountId, isSold: false } });
    if (!account) {
      return res.status(400).json({ success: false, message: 'Account does not exist or is already sold.' });
    }

    // Check if account is already in user's cart
    const existingCart = await Cart.findOne({ where: { userId, accountId } });
    if (existingCart) {
      return res.status(400).json({ success: false, message: 'Account already in cart.' });
    }

    // Add to cart
    await Cart.create({ userId, accountId });

    // ✅ Return updated cart list
    const updatedCart = await Cart.findAll({ where: { userId } });

    return res.status(201).json({
      success: true,
      message: 'Account added to cart.',
      cart: updatedCart
    });
  } catch (err) {
    console.error('Add to Cart Error:', err);
    return res.status(500).json({ success: false, message: 'Server error while adding to cart.' });
  }
};

//get cart

const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItems = await Cart.findAll({
      where: { userId, isSold: false },
      include: ['Account'] // If using Sequelize aliases or relationships
    });

    res.status(200).json({ success: true, cart: cartItems });
  } catch (err) {
    console.error('Get Cart Error:', err);
    res.status(500).json({ success: false, message: 'Server error while retrieving cart.' });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountId, quantity } = req.body;

    if (!accountId || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Invalid account or quantity.' });
    }

    const cartItem = await Cart.findOne({ where: { userId, accountId } });

    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Item not found in cart.' });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    return res.json({ success: true, message: 'Quantity updated.', cart: cartItem });
  } catch (err) {
    console.error('Update quantity error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const accountId = req.params.id;

    console.log('➡️ Remove request for accountId:', req.params.id, 'from userId:', req.user.id);


    const deleted = await Cart.destroy({
      where: {
        userId,
        accountId
      }
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Item not found in cart.' });
    }

    // Optionally include account details if frontend depends on it
    const updatedCart = await Cart.findAll({
      where: { userId },
      include: [{ model: Account }]
    });

    return res.json({ success: true, message: 'Item removed successfully.', cart: updatedCart });

  } catch (err) {
    console.error('Remove from cart error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export { addToCart, getCart, removeFromCart, updateCartQuantity }
