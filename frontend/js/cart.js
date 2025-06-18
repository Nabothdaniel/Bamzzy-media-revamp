

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
  cartCountElement.textContent = Array.isArray(user.cart) ? user.cart.length : 0;
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

    cartItem.querySelector('#itemName').textContent = `Account ID: ${item.accountId}`;
    cartItem.querySelector('#itemDetails').textContent = `Platform: ${account.platform || 'N/A'} | Categories: ${account.category || 'N/A'}`;
    cartItem.querySelector('#itemPrice').textContent = `₦${price.toLocaleString()}`;

    // Quantity
    const quantityElement = cartItem.querySelector('.quantity');
    if (quantityElement) {
      quantityElement.textContent = quantity;
    }

    // Increase and Decrease buttons
    const increaseBtn = cartItem.querySelector('.increase-btn');
    const decreaseBtn = cartItem.querySelector('.decrease-btn');

    if (increaseBtn) {
      increaseBtn.addEventListener('click', () => increaseQuantity(item.accountId));
    }

    if (decreaseBtn) {
      decreaseBtn.addEventListener('click', () => decreaseQuantity(item.accountId));
    }

    // Remove button
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

async function updateQuantityOnServer(accountId, quantity) {
  try {
    const res = await fetch('http://localhost:5000/api/v1/cart/update', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ accountId, quantity })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to update quantity');
    }

    await fetchCartData();     // refresh the latest cart
    renderCart();              // re-render UI
    updateUserInfo();
    updateCartSummary();
  } catch (err) {
    console.error('Update quantity failed:', err.message);
    showCustomAlert('Failed to update quantity', 'error');
  }
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

    // Remove the DOM element
    const element = document.querySelector(`[data-id="${accountId}"]`);
    if (element) element.remove();

    // ✅ Update the user cart with the new one from backend
    user.cart = result.cart;

    updateUserInfo();
    updateCartSummary();

    console.log('✅ Removed:', result.message);
  } catch (error) {
    console.error('❌ Error removing cart item:', error.message);
  }
}


async function handleCheckout() {
  const loader = document.getElementById('checkoutLoader');
  loader.classList.remove('hidden'); // Show loader

  let totalPrice = 0;

  user.cart.forEach(item => {
    const price = parseFloat(item.Account?.price) || 0;
    const quantity = item.quantity || 1;
    totalPrice += price * quantity;
  });

  if (user.balance < totalPrice) {
    alert('Insufficient balance.');
    loader.classList.add('hidden');
    return;
  }

  try {
    // 1. Initiate single checkout request to backend
    const checkoutRes = await fetch('http://localhost:5000/api/v1/transactions/create-transaction', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ totalPrice })
    });

    if (!checkoutRes.ok) {
      const errorData = await checkoutRes.json();
      throw new Error(errorData.message || 'Checkout failed');
    }

    // 2. Parse backend response
    await checkoutRes.json();

    // 3. Update local user state
    user.balance -= totalPrice;

    await fetchCartData();
    renderCart();          // Clear cart visually
    updateCartSummary();   // Update total count and disable buttons
    updateUserInfo();

    // 4. Show success modal
    checkoutSuccessModal.classList.add('active');
    checkoutSuccessModal.classList.remove('opacity-0', 'invisible');

  } catch (err) {
    console.error('Checkout error:', err.message);
    alert('Something went wrong during checkout: ' + err.message);
  } finally {
    loader.classList.add('hidden'); // Always hide loader
  }
}


function updateCartSummary() {
  if (!user || !user.cart) return;

  let totalItems = 0;
  let totalPrice = 0;

  user.cart.forEach(item => {
    const quantity = item.quantity || 1;
    const price = parseFloat(item.Account?.price) || 0;

    totalItems += quantity;
    totalPrice += price * quantity;
  });

  // Safely update DOM
  if (totalItemsElement) totalItemsElement.textContent = totalItems;
  if (totalPriceElement) totalPriceElement.textContent = `₦${totalPrice.toLocaleString()}`;
  if (checkoutButton) checkoutButton.disabled = user.balance < totalPrice;
  if (insufficientFundsElement)
    insufficientFundsElement.classList.toggle('hidden', user.balance >= totalPrice);
}





function increaseQuantity(accountId) {
  const item = user.cart.find(i => i.accountId === accountId);
  if (!item) return;

  const newQty = (item.quantity || 1) + 1;
  updateQuantityOnServer(accountId, newQty);
}

function decreaseQuantity(accountId) {
  const item = user.cart.find(i => i.accountId === accountId);
  if (!item || item.quantity <= 1) {
    showCustomAlert("Minimum quantity is 1", "error");
    return;
  }

  const newQty = item.quantity - 1;
  updateQuantityOnServer(accountId, newQty);
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

const checkoutButton = document.getElementById('checkoutButton');

if (checkoutButton) {
  checkoutButton.addEventListener('click', handleCheckout);
}


document.getElementById('logout').addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = 'login.html';
});

// Boot
document.addEventListener('DOMContentLoaded', init);
