import Cart from '../models/Cart.js';
import Account from '../models/Account.js';
import AccountCard from '../models/AccountCard.js';

const addToCart = async (req, res) => {
  const userId = req.user.id;
  const { accountCardId, quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Invalid quantity provided.' });
  }

  try {
    // Confirm AccountCard exists
    const accountCard = await AccountCard.findByPk(accountCardId);
    if (!accountCard) {
      return res.status(404).json({ message: 'Account card not found.' });
    }

    // Count available unsold accounts
    const unsoldAccountsCount = await Account.count({
      where: {
        accountCardId,
        isSold: false
      }
    });

    // Check if item already exists in cart
    const existingItem = await Cart.findOne({
      where: { userId, accountCardId },
    });

    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    const newTotalQuantity = currentCartQuantity + quantity;

    if (newTotalQuantity > unsoldAccountsCount) {
      return res.status(400).json({
        message: `Only ${unsoldAccountsCount - currentCartQuantity} item(s) available.`,
      });
    }

    if (existingItem) {
      existingItem.quantity = newTotalQuantity;
      await existingItem.save();
      return res.status(200).json({
        message: 'Cart item quantity updated.',
        cartItem: existingItem,
      });
    }

    // Create new cart item
    const cartItem = await Cart.create({
      userId,
      accountCardId,
      quantity,
      isSold: false,
    });

    return res.status(201).json({
      message: 'Item added to cart.',
      cartItem,
    });

  } catch (error) {
    console.error('Add to Cart Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};



const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{ model: AccountCard, as: 'card' }]
    });

    const cartWithAvailability = await Promise.all(cartItems.map(async (item) => {
      const card = item.card;

      const availableCount = await Account.count({
        where: { isSold: false, accountCardId: card.id }
      });

      return {
        ...item.toJSON(),
        card: {
          ...card.toJSON(),
          availableQuantity: availableCount
        }
      };
    }));

    res.status(200).json({ success: true, cart: cartWithAvailability });
  } catch (err) {
    console.error('Get Cart Error:', err);
    res.status(500).json({ success: false, message: 'Server error while retrieving cart.' });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountCardId, quantity } = req.body;

    if (!accountCardId || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Invalid card or quantity.' });
    }

    const availableCount = await Account.count({
      where: { isSold: false, accountCardId }
    });

    if (quantity > availableCount) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableCount} unsold accounts available in this card.`
      });
    }

    const cartItem = await Cart.findOne({ where: { userId, accountCardId } });
    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Item not found in cart.' });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.json({ success: true, message: 'Quantity updated.', cart: cartItem });
  } catch (err) {
    console.error('Update quantity error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const accountCardId = req.params.id;

    const deleted = await Cart.destroy({
      where: { userId, accountCardId }
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Item not found in cart.' });
    }

    const updatedCart = await Cart.findAll({
      where: { userId, isSold: false },
      include: [{ model: AccountCard, as: 'card' }]
    });

    const cartWithAvailability = await Promise.all(updatedCart.map(async (item) => {
      const card = item.card;

      const availableCount = await Account.count({
        where: { isSold: false, accountCardId: card.id }
      });

      return {
        ...item.toJSON(),
        card: {
          ...card.toJSON(),
          availableQuantity: availableCount
        }
      };
    }));

    return res.json({
      success: true,
      message: 'Item removed successfully.',
      cart: cartWithAvailability
    });

  } catch (err) {
    console.error('Remove from cart error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export {
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity
};
