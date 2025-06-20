// DOM Elements
let cartItemsContainer = document.getElementById('cartItems');
const emptyCartElement = document.getElementById('emptyCart');
const cartItemTemplate = document.getElementById('cartItemTemplate');
const totalItemsElement = document.getElementById('totalItems');
const totalPriceElement = document.getElementById('totalPrice');
const cartUserBalanceElement = document.getElementById('cartUserBalance');
const userBalance = document.getElementById('userBalance');
const insufficientFundsElement = document.getElementById('insufficientFunds');
const fundFromCartButton = document.getElementById('fundFromCart');
const cartCountElement = document.getElementById('cartCount');
const fundModal = document.getElementById('fundModal');
const closeModalButtons = document.querySelectorAll('.close');
const sendFundRequestButton = document.getElementById('sendFundRequest');
const checkoutSuccessModal = document.getElementById('checkoutSuccessModal');
const viewPurchasesBtn = document.getElementById('viewPurchasesBtn');
const continueShoppingBtn = document.getElementById('continueShopping');
const checkoutButton = document.getElementById('checkoutButton');
const BASE_URL = "https://bamzzy-media-revamp.onrender.com";

// Utilities
function getSessionData() {
  try {
    return JSON.parse(window.name || '{}');
  } catch {
    return {};
  }
}

function getAuthHeaders() {
  const session = getSessionData();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.token}`
  };
}

function showCustomAlert(message, type = "success") {
  const alertBox = document.getElementById("customAlert");
  const alertMsg = document.getElementById("customAlertMessage");

  alertBox.className = "fixed bottom-6 right-6 z-50 px-4 py-3 rounded shadow-lg transition duration-300";

  if (type === "success") {
    alertBox.classList.add("bg-green-100", "text-green-800");
  } else if (type === "error") {
    alertBox.classList.add("bg-red-100", "text-red-800");
  } else {
    alertBox.classList.add("bg-gray-100", "text-gray-800");
  }

  alertMsg.textContent = message;
  alertBox.classList.remove("hidden");

  setTimeout(() => {
    alertBox.classList.add("hidden");
  }, 3000);
}

// User state
window.user = window.user || {
  name: '',
  balance: 0,
  cart: []
};

async function init() {
  try {
    await Promise.all([
      fetchUserBalance(),
      fetchCartData()
    ]);

    updateUserInfo();
    renderCart();
    updateCartSummary();
  } catch (err) {
    console.error('Initialization error:', err);
  }
}

async function fetchUserBalance() {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/profile`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error('Failed to fetch user balance');

    const data = await res.json();
    const balance = parseFloat(data.user?.balance) || 0;

    window.user.balance = balance;
    cartUserBalanceElement.textContent = `₦${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  } catch (err) {
    console.error('Error fetching user balance:', err.message);
  }
}

async function fetchCartData() {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/cart/get`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch cart data');

    const data = await response.json();
    window.user.cart = data.cart || [];
  } catch (err) {
    console.error('Error loading cart data:', err.message);
  }
}

function updateUserInfo() {
  cartUserBalanceElement.textContent = `₦${window.user.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  cartCountElement.textContent = Array.isArray(window.user.cart) ? window.user.cart.length : 0;
}

function renderCart() {
  if (!window.user || !Array.isArray(window.user.cart)) {
    console.warn('User cart is undefined or not an array.');
    return;
  }

  if (window.user.cart.length === 0) {
    cartItemsContainer.innerHTML = '';
    emptyCartElement.classList.remove('hidden');
    totalItemsElement.textContent = '0';
    totalPriceElement.textContent = '₦0';
    checkoutButton.disabled = true;
    return;
  }

  emptyCartElement.classList.add('hidden');
  cartItemsContainer.innerHTML = '';

  let totalAccounts = 0;
  let totalPrice = 0;

  window.user.cart.forEach(item => {
    const card = item.card || {}; // AccountCard
    const quantity = item.quantity || 1;
    const pricePerAccount = parseFloat(card.price) || 0;
    const subtotal = quantity * pricePerAccount;

    totalAccounts += quantity;
    totalPrice += subtotal;

    const cartItem = cartItemTemplate.cloneNode(true);
    cartItem.classList.remove('hidden');
    cartItem.classList.add('cart-item');
    cartItem.setAttribute('data-id', card.id);

    cartItem.querySelector('#itemName').textContent = `${card.platform || 'Platform'} - ₦${pricePerAccount}`;
    cartItem.querySelector('#itemDetails').textContent = `Category: ${card.category || 'N/A'}`;

    // ✅ Show quantity from cart, not card
    cartItem.querySelector('#itemQuantity').textContent = `${quantity}`;

    cartItem.querySelector('#itemPrice').textContent = `₦${subtotal.toLocaleString()}`;

    const quantityElement = cartItem.querySelector('.quantity');
    if (quantityElement) {
      quantityElement.textContent = quantity;
    }

    const increaseBtn = cartItem.querySelector('.increase-btn');
    const decreaseBtn = cartItem.querySelector('.decrease-btn');

    if (increaseBtn) {
      increaseBtn.addEventListener('click', () => increaseQuantity(card.id));
    }

    if (decreaseBtn) {
      decreaseBtn.addEventListener('click', () => decreaseQuantity(card.id));
    }

    const removeBtn = cartItem.querySelector('.remove-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => removeFromCart(card.id));
    }

    cartItemsContainer.appendChild(cartItem);
  });

  totalItemsElement.textContent = totalAccounts;
  totalPriceElement.textContent = `₦${totalPrice.toLocaleString()}`;
  checkoutButton.disabled = window.user.balance < totalPrice;
}

async function removeFromCart(accountTypeId) {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/cart/delete/${accountTypeId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to remove item');
    }

    const element = document.querySelector(`[data-id="${accountTypeId}"]`);
    if (element) element.remove();

    window.user.cart = result.cart;
    updateUserInfo();
    updateCartSummary();
    console.log('✅ Removed:', result.message);
  } catch (error) {
    console.error('❌ Error removing cart item:', error.message);
  }
}

async function handleCheckout() {
  const loader = document.getElementById('checkoutLoader');
  loader.classList.remove('hidden');

  let totalPrice = 0;

  window.user.cart.forEach(item => {
    const price = parseFloat(item.card?.price) || 0;
    const quantity = item.quantity || 1;
    totalPrice += price * quantity;
  });

  if (window.user.balance < totalPrice) {
    alert('Insufficient balance.');
    loader.classList.add('hidden');
    return;
  }

  try {
    const checkoutRes = await fetch(`${BASE_URL}/api/v1/transactions/create-transaction`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ totalPrice }) // You may need to send cart items too!
    });

    if (!checkoutRes.ok) {
      const errorData = await checkoutRes.json();
      throw new Error(errorData.message || 'Checkout failed');
    }

    await checkoutRes.json();

    window.user.balance -= totalPrice;

    await fetchCartData();
    renderCart();
    updateCartSummary();
    updateUserInfo();

    checkoutSuccessModal.classList.add('active');
    checkoutSuccessModal.classList.remove('opacity-0', 'invisible');

  } catch (err) {
    console.error('Checkout error:', err.message);
    alert('Something went wrong during checkout: ' + err.message);
  } finally {
    loader.classList.add('hidden');
  }
}

function updateCartSummary() {
  if (!window.user || !window.user.cart) return;

  let totalItems = 0;
  let totalPrice = 0;

  window.user.cart.forEach(item => {
    const quantity = item.quantity || 1;
    const price = parseFloat(item.card?.price) || 0;

    totalItems += quantity;
    totalPrice += price * quantity;
  });

  if (totalItemsElement) totalItemsElement.textContent = totalItems;
  if (totalPriceElement) totalPriceElement.textContent = `₦${totalPrice.toLocaleString()}`;
  if (checkoutButton) checkoutButton.disabled = window.user.balance < totalPrice;
  if (insufficientFundsElement)
    insufficientFundsElement.classList.toggle('hidden', window.user.balance >= totalPrice);
}

closeModalButtons.forEach(button => {
  button.addEventListener('click', () => {
    fundModal.classList.remove('active');
    fundModal.classList.add('opacity-0', 'invisible');
    checkoutSuccessModal.classList.remove('active');
    checkoutSuccessModal.classList.add('opacity-0', 'invisible');
  });
});

viewPurchasesBtn.addEventListener('click', () => {
  window.location.href = './purchased-account.html';
});

continueShoppingBtn.addEventListener('click', () => {
  window.location.href = 'dashboard.html';
  checkoutSuccessModal.classList.remove('active');
  checkoutSuccessModal.classList.add('opacity-0', 'invisible');
});

if (checkoutButton) {
  checkoutButton.addEventListener('click', handleCheckout);
}

document.getElementById('logout').addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = './login.html';
});

document.addEventListener('DOMContentLoaded', init);
