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

// DOM Elements (no changes here)
const cartItemsContainer = document.getElementById('cartItems');
const emptyCartElement = document.getElementById('emptyCart');
const cartItemTemplate = document.getElementById('cartItemTemplate');
const totalItemsElement = document.getElementById('totalItems');
const totalPriceElement = document.getElementById('totalPrice');
const cartUserBalanceElement = document.getElementById('cartUserBalance');
const checkoutButton = document.getElementById('checkoutButton');
const insufficientFundsElement = document.getElementById('insufficientFunds');
const fundFromCartButton = document.getElementById('fundFromCart');
const userNameElement = document.getElementById('userName');
const cartCountElement = document.getElementById('cartCount');
const fundModal = document.getElementById('fundModal');
const fundAccountButton = document.getElementById('fundAccount');
const closeModalButtons = document.querySelectorAll('.close');
const sendFundRequestButton = document.getElementById('sendFundRequest');
const checkoutSuccessModal = document.getElementById('checkoutSuccessModal');
const viewPurchasesBtn = document.getElementById('viewPurchasesBtn');
const continueShoppingBtn = document.getElementById('continueShopping');

// State
let user = {
  name: '',
  balance: 0,
  cart: []
};

// Initialize the app
function init() {
  fetchCartData();
  setupEventListeners();
}

// Fetch user and cart data from backend
async function fetchCartData() {
  try {
    const response = await fetch('http://localhost:5000/api/v1/cart/get', {
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch cart data');

    const data = await response.json();

    user = {
      name: data.user?.name || '',
      balance: data.user?.balance || 0,
      cart: data.cart || []
    };

    updateUserInfo();
    renderCart();
  } catch (err) {
    console.error('Error loading cart data:', err);
  }
}

function updateUserInfo() {
  userNameElement.textContent = user.name;
  cartUserBalanceElement.textContent = `₦${user.balance.toLocaleString()}`;
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
    cartItem.setAttribute('data-id', item.id);

    cartItem.querySelector('#itemImage').src = `http://localhost:5000/${account.image}` || '';

    cartItem.querySelector('#itemName').textContent = `Account ID: ${item.accountId}`;
    cartItem.querySelector('#itemDetails').textContent = `Platform: ${account.platform || 'N/A'} | Followers: ${account.followers || 'N/A'}`;
    cartItem.querySelector('#itemPrice').textContent = `₦${price.toLocaleString()}`;

    const quantityElement = cartItem.querySelector('.quantity');
    quantityElement.textContent = quantity;

    const decreaseBtn = cartItem.querySelector('[data-action="decrease"]');
    const increaseBtn = cartItem.querySelector('[data-action="increase"]');
    const removeBtn = cartItem.querySelector('.remove-btn');

    decreaseBtn.addEventListener('click', () => {
      let currentQuantity = parseInt(quantityElement.textContent);
      if (currentQuantity > 1) {
        quantityElement.textContent = currentQuantity - 1;
        item.quantity = currentQuantity - 1;
      } else {
        removeFromCart(item.id);
      }
      updateCartSummary();
    });

    increaseBtn.addEventListener('click', () => {
      let currentQuantity = parseInt(quantityElement.textContent);
      quantityElement.textContent = currentQuantity + 1;
      item.quantity = currentQuantity + 1;
      updateCartSummary();
    });

    removeBtn.addEventListener('click', () => {
      removeFromCart(item.id);
    });

    cartItemsContainer.appendChild(cartItem);
  });

  totalItemsElement.textContent = totalItems;
  totalPriceElement.textContent = `₦${totalPrice.toLocaleString()}`;
  checkoutButton.disabled = user.balance < totalPrice;
  insufficientFundsElement.classList.toggle('hidden', user.balance >= totalPrice);
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
    cartItem.setAttribute('data-id', item.id);

    cartItem.querySelector('#itemImage').src = `http://localhost:5000/${account.image}` || '';

    cartItem.querySelector('#itemName').textContent = `Account ID: ${item.accountId}`;
    cartItem.querySelector('#itemDetails').textContent = `Platform: ${account.platform || 'N/A'} | Followers: ${account.followers || 'N/A'}`;
    cartItem.querySelector('#itemPrice').textContent = `₦${price.toLocaleString()}`;

    // Optional: Show quantity as static number (if desired)
    const quantityElement = cartItem.querySelector('.quantity');
    if (quantityElement) {
      quantityElement.textContent = quantity;
    }

    // Remove increment/decrement button logic
    const decreaseBtn = cartItem.querySelector('[data-action="decrease"]');
    const increaseBtn = cartItem.querySelector('[data-action="increase"]');
    if (decreaseBtn) decreaseBtn.remove();
    if (increaseBtn) increaseBtn.remove();

    // Keep only the remove button
    const removeBtn = cartItem.querySelector('.remove-btn');
    removeBtn.addEventListener('click', () => {
      removeFromCart(item.id);
    });

    cartItemsContainer.appendChild(cartItem);
  });

  totalItemsElement.textContent = totalItems;
  totalPriceElement.textContent = `₦${totalPrice.toLocaleString()}`;
  checkoutButton.disabled = user.balance < totalPrice;
  insufficientFundsElement.classList.toggle('hidden', user.balance >= totalPrice);
}



fundAccountButton.addEventListener('click', (e) => {
  e.preventDefault();
  showFundModal();
});

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

function updateCartSummary() {
  let totalItems = 0;
  let totalPrice = 0;

  document.querySelectorAll('.cart-item').forEach(item => {
    const quantity = parseInt(item.querySelector('.quantity').textContent);
    const priceText = item.querySelector('#itemPrice').textContent;
    const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;

    totalItems += quantity;
    totalPrice += price * quantity;
  });

  totalItemsElement.textContent = totalItems;
  totalPriceElement.textContent = `₦${totalPrice.toLocaleString()}`;
  checkoutButton.disabled = user.balance < totalPrice;
  insufficientFundsElement.classList.toggle('hidden', user.balance >= totalPrice);
}


function showFundModal() {
  fundModal.classList.add('active');
  fundModal.classList.remove('opacity-0', 'invisible');
  document.getElementById('fundAmount').focus();
}

document.addEventListener('DOMContentLoaded', init);
