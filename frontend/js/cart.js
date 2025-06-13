

// DOM Elements
let cartItemsContainer = document.getElementById('cartItems');
const emptyCartElement = document.getElementById('emptyCart');
const cartItemTemplate = document.getElementById('cartItemTemplate');
const totalItemsElement = document.getElementById('totalItems');
const totalPriceElement = document.getElementById('totalPrice');
const cartUserBalanceElement = document.getElementById('cartUserBalance');
const userBalance = document.getElementById('userBalance');
const checkoutButton = document.getElementById('checkoutButton');
const insufficientFundsElement = document.getElementById('insufficientFunds');
const fundFromCartButton = document.getElementById('fundFromCart');
const cartCountElement = document.getElementById('cartCount');
const fundModal = document.getElementById('fundModal');
const closeModalButtons = document.querySelectorAll('.close');
const sendFundRequestButton = document.getElementById('sendFundRequest');
const checkoutSuccessModal = document.getElementById('checkoutSuccessModal');
const viewPurchasesBtn = document.getElementById('viewPurchasesBtn');
const continueShoppingBtn = document.getElementById('continueShopping');



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
    const res = await fetch('http://localhost:5000/api/v1/auth/profile', {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error('Failed to fetch user balance');

    const data = await res.json();
    const balance = parseFloat(data.user?.balance) || 0;

    user.balance = balance; // ✅ Store balance in user state

    cartUserBalanceElement.textContent = `₦${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  } catch (err) {
    console.error('Error fetching user balance:', err.message);
  }
}

async function fetchCartData() {
  try {
    const response = await fetch('http://localhost:5000/api/v1/cart/get', {
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch cart data');

    const data = await response.json();
    user.cart = data.cart || [];
  } catch (err) {
    console.error('Error loading cart data:', err.message);
  }
}

function updateUserInfo() {
  cartUserBalanceElement.textContent = `₦${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  cartCountElement.textContent = user.cart.length;
}

function renderCart() {
  if (user.cart.length === 0) {
    cartItemsContainer.innerHTML = '';
    emptyCartElement.classList.remove('hidden');
    totalItemsElement.textContent = '0';
    totalPriceElement.textContent = '₦0';
    checkoutButton.disabled = true;
    return;
  }

  emptyCartElement.classList.add('hidden');
  cartItemsContainer.innerHTML = '';

  let totalItems = 0;
  let totalPrice = 0;

  user.cart.forEach(item => {
    const account = item.Account || {};
    const price = parseFloat(account.price) || 0;
    const quantity = item.quantity || 1;

    totalItems += quantity;
    totalPrice += price * quantity;

    const cartItem = cartItemTemplate.cloneNode(true);
    cartItem.classList.remove('hidden');
    cartItem.classList.add('cart-item');
    cartItem.setAttribute('data-id', item.accountId);

    cartItem.querySelector('#itemImage').src = `http://localhost:5000/${account.image}` || '';
    cartItem.querySelector('#itemName').textContent = `Account ID: ${item.accountId}`;
    cartItem.querySelector('#itemDetails').textContent = `Platform: ${account.platform || 'N/A'} | Followers: ${account.followers || 'N/A'}`;
    cartItem.querySelector('#itemPrice').textContent = `₦${price.toLocaleString()}`;

    const quantityElement = cartItem.querySelector('.quantity');
    if (quantityElement) {
      quantityElement.textContent = quantity;
    }

    const removeBtn = cartItem.querySelector('.remove-btn');
    removeBtn.addEventListener('click', () => {
      removeFromCart(item.accountId);
    });

    cartItemsContainer.appendChild(cartItem);
  });

  totalItemsElement.textContent = totalItems;
  totalPriceElement.textContent = `₦${totalPrice.toLocaleString()}`;
  checkoutButton.disabled = user.balance < totalPrice;
  insufficientFundsElement.classList.toggle('hidden', user.balance >= totalPrice);
}

function updateCartSummary() {
  let totalItems = 0;
  let totalPrice = 0;

  user.cart.forEach(item => {
    const price = parseFloat(item.Account?.price) || 0;
    const quantity = item.quantity || 1;

    totalItems += quantity;
    totalPrice += price * quantity;
  });

  totalItemsElement.textContent = totalItems;
  totalPriceElement.textContent = `₦${totalPrice.toLocaleString()}`;
  checkoutButton.disabled = user.balance < totalPrice;
  insufficientFundsElement.classList.toggle('hidden', user.balance >= totalPrice);
}

async function removeFromCart(accountId) {
  try {
    const response = await fetch(`http://localhost:5000/api/v1/cart/delete/${accountId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to remove item');
    }

    const element = document.querySelector(`[data-id="${accountId}"]`);
    if (element) element.remove();

    user.cart = user.cart.filter(item => item.accountId !== accountId);

    updateUserInfo();
    updateCartSummary();

    console.log('✅ Removed:', result.message);
  } catch (error) {
    console.error('❌ Error removing cart item:', error.message);
  }
}

async function handleCheckout() {
  let totalPrice = 0;

  // 1. Calculate total price
  user.cart.forEach(item => {
    const price = parseFloat(item.Account?.price) || 0;
    const quantity = item.quantity || 1;
    totalPrice += price * quantity;
  });

  if (user.balance < totalPrice) {
    alert('Insufficient balance.');
    return;
  }

  try {
    // 2. Deduct balance and update backend
    const newBalance = user.balance - totalPrice;

    const balanceUpdateRes = await fetch('http://localhost:5000/api/v1/auth/update-balance', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ balance: newBalance })
    });

    if (!balanceUpdateRes.ok) throw new Error('Failed to update balance');

    user.balance = newBalance;

    // 3. Create transaction entries
    const transactions = user.cart.map(item => ({
      transactionId: generateTransactionId(),
      platform: item.Account?.platform || 'Unknown',
      accountType: item.Account?.type || 'General',
      price: parseFloat(item.Account?.price) || 0,
      status: 'Delivered',
      date: new Date().toISOString().split('T')[0]
    }));

    // Send all transactions to backend
    const transactionRes = await fetch('http://localhost:5000/api/v1/transactions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ transactions })
    });

    if (!transactionRes.ok) throw new Error('Failed to record transactions');

    // 4. Show success modal and optionally clear cart
    checkoutSuccessModal.classList.add('active');
    checkoutSuccessModal.classList.remove('opacity-0', 'invisible');

    // Clear cart (optional, depending on your logic)
    user.cart = [];
    renderCart();
    updateUserInfo();
    updateCartSummary();

  } catch (err) {
    console.error('Checkout error:', err.message);
    alert('Something went wrong during checkout.');
  }
}

function generateTransactionId(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}



function showFundModal() {
  fundModal.classList.add('active');
  fundModal.classList.remove('opacity-0', 'invisible');
  document.getElementById('fundAmount').focus();
}

// Modal + Button Handlers
fundFromCartButton.addEventListener('click', (e) => {
  e.preventDefault();
  showFundModal();
});

closeModalButtons.forEach(button => {
  button.addEventListener('click', () => {
    fundModal.classList.remove('active');
    fundModal.classList.add('opacity-0', 'invisible');
    checkoutSuccessModal.classList.remove('active');
    checkoutSuccessModal.classList.add('opacity-0', 'invisible');
  });
});

sendFundRequestButton.addEventListener('click', () => {
  const amount = parseInt(document.getElementById('fundAmount').value);
  if (isNaN(amount) || amount < 1000) {
    alert('Please enter a valid amount (minimum ₦1000)');
    return;
  }
  alert(`Fund request for ₦${amount.toLocaleString()} has been sent to admin. They will contact you shortly.`);
  fundModal.classList.remove('active');
  fundModal.classList.add('opacity-0', 'invisible');
});

viewPurchasesBtn.addEventListener('click', () => {
  window.location.href = 'purchases.html';
});

continueShoppingBtn.addEventListener('click', () => {
  window.location.href = 'dashboard.html';
  checkoutSuccessModal.classList.remove('active');
  checkoutSuccessModal.classList.add('opacity-0', 'invisible');
});

document.getElementById('logout').addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = 'login.html';
});

// Boot
document.addEventListener('DOMContentLoaded', init);
