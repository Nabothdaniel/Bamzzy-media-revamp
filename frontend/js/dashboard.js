document.addEventListener('DOMContentLoaded', () => {
  const BASE_URL = "https://bamzzy-media-revamp.onrender.com";
  let sessionData = {};
  try {
    sessionData = JSON.parse(window.name || '{}');
  } catch {
    sessionData = {};
  }

  const fundBtn = document.getElementById('fundAccountBtn');
  const modal = document.getElementById('fundModal');
  const closeModal = document.getElementById('closeModal');
  const showcaseContainer = document.getElementById("showcaseContainer");
  const seeMoreBtn = document.getElementById("seeMoreBtn");

  let allAccounts = [];

  function showCustomAlert(message, type = "success") {
    const alertBox = document.getElementById("customAlert");
    const alertMsg = document.getElementById("customAlertMessage");

    alertBox.className = "fixed top-2 right-6 z-50 px-4 py-3 rounded shadow-lg transition duration-300";

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

  fundBtn?.addEventListener('click', () => modal.classList.remove('hidden'));
  closeModal?.addEventListener('click', () => modal.classList.add('hidden'));

  document.getElementById('fundForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = e.target.amount.value;
    alert(`Funding account with $${amount}...`);
    modal.classList.add('hidden');
  });

  seeMoreBtn?.addEventListener("click", () => {
    const isExpanded = seeMoreBtn.dataset.expanded === "true";
    seeMoreBtn.textContent = isExpanded ? "See More" : "Show Less";
    seeMoreBtn.dataset.expanded = isExpanded ? "false" : "true";
    renderAccounts(allAccounts);
  });

  function getSessionData() {
    try {
      return JSON.parse(window.name || '{}');
    } catch {
      return {};
    }
  }

  async function fetchAndDisplayAccounts() {
    showcaseContainer.innerHTML = `
      <div class="col-span-full items-center gap-2 flex justify-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" class='animate-spin h-8 w-8' viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        Loading Accounts...
      </div>
    `;

    const token = getSessionData().token;

    if (!token) {
      showcaseContainer.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-red-500">You're not logged in. Please log in to view your accounts.</p>
        </div>`;
      seeMoreBtn.style.display = 'none';
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/v1/accounts/user-accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to fetch accounts");

      const { accounts } = await response.json();

      if (!accounts.length) {
        showcaseContainer.innerHTML = `
          <div class="col-span-full text-center py-12">
            <p class="text-gray-500">No accounts found.</p>
          </div>`;
        seeMoreBtn.style.display = "none";
        return;
      }

      allAccounts = accounts;
      renderAccounts(allAccounts);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      showcaseContainer.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-red-500">Failed to load accounts. Please try again later.</p>
        </div>`;
      seeMoreBtn.style.display = 'none';
    }
  }

  function renderAccounts(accounts) {
    const showAll = seeMoreBtn.dataset.expanded === "true";
    const accountsToShow = showAll ? accounts : accounts.slice(0, 10);

    showcaseContainer.innerHTML = '';

    if (!accountsToShow.length) {
      showcaseContainer.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-gray-500">No matching accounts found.</p>
        </div>`;
      return;
    }

    accountsToShow.forEach(account => {
      const card = document.createElement("div");
      card.setAttribute("data-id", account.id);

      console.log(account)

      let badgeClass = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-xs font-semibold max-w-max';
      let icon = '';
      const platform = account.platform?.toLowerCase();

      switch (platform) {
        case 'tiktok':
          badgeClass += ' bg-red-500';
          icon = '<i class="fab fa-tiktok"></i>';
          break;
        case 'twitter':
          badgeClass += ' bg-black';
          icon = '<i class="fab fa-twitter"></i>';
          break;
        case 'facebook':
          badgeClass += ' bg-blue-400';
          icon = '<i class="fab fa-facebook"></i>';
          break;
        case 'instagram':
          badgeClass += ' bg-pink-600';
          icon = '<i class="fab fa-instagram"></i>';
          break;
        default:
          badgeClass += ' bg-gray-500';
          icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                         stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                         <path stroke-linecap="round" stroke-linejoin="round"
                         d="m21 7.5-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
                       </svg>`;
      }

      card.innerHTML = `
                    <div
                        class="account-card glass-effect rounded-2xl p-6 border border-blue-500/20 hover:border-blue-400/40">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center space-x-3">
                              <div class="${badgeClass}">
                                    ${icon}
                           <span class="capitalize">${account.platform}</span>
                           </div>
                            </div>
                        </div>
                        <div class="space-y-2 mb-6">
                            <div class="flex justify-between">
                                <span class="text-gray-400">Category:</span>
                                <span class="text-white font-semibold">${account.category}</span>
                            </div>
                              <div class="flex justify-between">
                                 <span class="text-gray-400">Quantity:</span>
                                 <span class="text-white font-semibold">${account.quantity || 0}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400">price per quantity:</span>
                                <span class="text-yellow-600"> ₦${account.price.toLocaleString()}</span>
                            </div>
                            <div class="flex flex-col justify-between">
                                <span class="text-gray-400">Description:</span>
                                <span class="text-white"> ${account.description}</span>
                            </div>
                            
                            <div class="flex justify-between">
                                <span class="text-gray-400">Verified:</span>
                                <span class="text-blue-400"><i class="fas fa-check-circle"></i></span>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button
                                class="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-900 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all font-semibold">
                                View Details
                            </button>
    
                        </div>
                    </div>`;

      card.addEventListener("click", () => showAccountModal(account));
      showcaseContainer.appendChild(card);
    });

    seeMoreBtn.style.display = accounts.length > 10 ? 'block' : 'none';
  }

  function showAccountModal(account) {
    const modal = document.getElementById("accountModal");
    const modalContent = document.getElementById("accountDetails");

    if (!modal || !modalContent) return;

    // Show the modal
    modal.classList.remove("hidden");

    // Inject the modal content
    modalContent.innerHTML = `
    <button id="closeAccountModal"
      class="absolute top-4 my-5 right-4 text-gray-400 hover:text-white text-2xl transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" class='h-8 w-8' fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    </button>
    <div class="rounded-2xl glass-effect p-6 border border-blue-500/20">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl text-white font-semibold capitalize">${account.category}</h3>
      </div>
      <div class="space-y-3 mb-6">
        <div class="flex justify-between">
          <span class="text-gray-400">Platform:</span>
          <span class="text-white font-medium capitalize">${account.platform}</span>
        </div>
        <div class="flex flex-col justify-between">
          <span class="text-gray-400">Description:</span>
          <span class="text-white">${account.description}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Available:</span>
          <span class="text-white font-semibold">${account.quantity || 0}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Price per Quantity:</span>
          <span class="text-yellow-600 font-semibold">₦${Number(account.price).toLocaleString()}</span>
        </div>
      </div>
      <div class="mt-4">
        <label for="quantityToAdd" class="block text-sm text-white font-medium mb-1">Quantity:</label>
        <input 
          type="number" 
          id="quantityToAdd" 
          name="quantity" 
          min="1" 
          max="${account.quantity}" 
          value="1"
          class="w-full border border-blue-500/20 bg-transparent text-white px-3 py-2 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          class="add-to-cart-btn w-full py-3 bg-gradient-to-r from-blue-600 to-blue-900 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all"
          data-id="${account.id}"
        >
          Purchase Account
        </button>
      </div>
    </div>
  `;

    // Attach the close button event listener AFTER setting innerHTML
    const closeBtn = document.getElementById("closeAccountModal");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
      });

      // Optional: for mobile support, also listen for touchstart
      closeBtn.addEventListener("touchstart", () => {
        modal.classList.add("hidden");
      }, { passive: true });
    }
  }


  async function addToCart(accountId, quantity, token, buttonElement) {
    if (!buttonElement) return;

    const originalText = buttonElement.textContent;
    buttonElement.disabled = true;
    buttonElement.textContent = "Adding to cart...";

    try {
      const response = await fetch(`${BASE_URL}/api/v1/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accountCardId: accountId, quantity }),
      });

      const data = await response.json();

      if (data.success) {
        buttonElement.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="white" class="w-5 h-5 inline-block mr-1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg> Added`;
        fetchAndDisplayAccounts()
        updateCartCount();
        showCustomAlert("Account added to cart!");
      } else {
        buttonElement.textContent = originalText;
        showCustomAlert(data.message || "Failed to add to cart.", "error");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      buttonElement.textContent = originalText;
      showCustomAlert("An unexpected error occurred.", "error");
    } finally {
      buttonElement.disabled = false;
    }
  }

  async function updateCartCount() {
    const session = getSessionData();

    const response = await fetch(`${BASE_URL}/api/v1/cart/get`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token || ''}`
      }
    });

    const data = await response.json();
    document.getElementById("cartCount").textContent = data.cart?.length || 0;
    document.getElementById("headerCartCount").textContent = data.cart?.length || 0;
  }

  updateCartCount();
  fetchAndDisplayAccounts();
});
