
document.addEventListener('DOMContentLoaded', () => {
  let sessionData = {};
  try {
    sessionData = JSON.parse(window.name || '{}');
  } catch {
    sessionData = {};
  }

  const fundBtn = document.getElementById('fundAccountBtn');
  const modal = document.getElementById('fundModal');
  const closeModal = document.getElementById('closeModal');
  const buttons = document.querySelectorAll('#platformButtons button');
  const platformDropdown = document.getElementById('platformDropdown');
  const showcaseContainer = document.getElementById("showcaseContainer");
  const seeMoreBtn = document.getElementById("seeMoreBtn");
  const searchInput = document.getElementById("accountSearch");

  const initialVisibleCount = 10;
  let currentPlatformFilter = 'all';
  let allAccounts = [];

  fundBtn?.addEventListener('click', () => modal.classList.remove('hidden'));
  closeModal?.addEventListener('click', () => modal.classList.add('hidden'));

  document.getElementById('fundForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = e.target.amount.value;
    alert(`Funding account with $${amount}...`);
    modal.classList.add('hidden');
  });

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      buttons.forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-200', 'hover:bg-blue-200');
      });

      button.classList.add('bg-blue-600', 'text-white');
      button.classList.remove('bg-gray-200', 'hover:bg-blue-200');

      currentPlatformFilter = button.dataset.platform;
      filterAccounts(currentPlatformFilter, searchInput.value.trim().toLowerCase());
    });
  });

  platformDropdown?.addEventListener('change', (e) => {
    currentPlatformFilter = e.target.value;
    filterAccounts(currentPlatformFilter, searchInput.value.trim().toLowerCase());
  });

  searchInput?.addEventListener("input", () => {
    filterAccounts(currentPlatformFilter, searchInput.value.trim().toLowerCase());
  });

  seeMoreBtn?.addEventListener("click", () => {
    const isExpanded = seeMoreBtn.dataset.expanded === "true";
    seeMoreBtn.textContent = isExpanded ? "See More" : "Show Less";
    seeMoreBtn.dataset.expanded = isExpanded ? "false" : "true";
    filterAccounts(currentPlatformFilter, searchInput.value.trim().toLowerCase());
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

    const sessionData = getSessionData();
    const token = sessionData.token;

    if (!token) {
      showcaseContainer.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-red-500">You're not logged in. Please log in to view your accounts.</p>
      </div>
    `;
      seeMoreBtn.style.display = 'none';
      return;
    }

    const apiUrl = `http://localhost:5000/api/v1/accounts/user-accounts`;

    try {
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Failed to fetch accounts");

      const { accounts } = await response.json();

      if (!accounts.length) {
        showcaseContainer.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-gray-500">No accounts found.</p>
        </div>
      `;
        seeMoreBtn.style.display = "none";
        return;
      }

      allAccounts = accounts;
      filterAccounts(currentPlatformFilter, searchInput.value.trim().toLowerCase());

    } catch (err) {
      console.error("Error fetching accounts:", err);
      showcaseContainer.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-red-500">Failed to load accounts. Please try again later.</p>
      </div>
    `;
      seeMoreBtn.style.display = 'none';
    }
  }


  function filterAccounts(platform, search = "") {
    showcaseContainer.innerHTML = "";
    let visibleCount = 0;

    const filtered = allAccounts.filter(account => {
      const title = account.title?.toLowerCase() || "";
      const description = account.description?.toLowerCase() || "";
      const accountPlatform = account.platform?.toLowerCase() || "";
      const price = String(account.price || "");
      const searchTerm = search.toLowerCase();

      const matchesPlatform =
        platform === "all" || accountPlatform.includes(platform.toLowerCase());

      const matchesSearch =
        searchTerm === "" ||
        title.includes(searchTerm) ||
        description.includes(searchTerm) ||
        price.includes(searchTerm) ||
        accountPlatform.includes(searchTerm);

      return matchesPlatform && matchesSearch;
    });

    if (filtered.length === 0) {
      showcaseContainer.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-gray-500">No accounts match your search.</p>
      </div>
    `;
      seeMoreBtn.style.display = "none";
      return;
    }

    filtered.forEach((account, index) => {
      const card = document.createElement('div');
      card.className = 'showcase-item bg-white rounded-lg cursor-pointer shadow hover:shadow-lg transition p-4 flex flex-col';

      let badgeClass = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-xs font-semibold max-w-max';
      let icon = '';
      switch (account.platform?.toLowerCase()) {
        case 'tiktok': badgeClass += ' bg-red-500'; icon = '<i class="fab fa-tiktok"></i>'; break;
        case 'twitter': badgeClass += ' bg-black'; icon = '<i class="fab fa-twitter"></i>'; break;
        case 'facebook': badgeClass += ' bg-blue-400'; icon = '<i class="fab fa-facebook"></i>'; break;
        case 'instagram': badgeClass += ' bg-pink-600'; icon = '<i class="fab fa-instagram"></i>'; break;
        default: badgeClass += ' bg-gray-500'; icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
</svg>
`; break;
      }


      card.innerHTML = `
     <div tabindex="0"
                    class="showcase-content flex flex-col flex-grow p-4 rounded-2xl border border-gray-200 hover:border-blue-500 focus:border-blue-500 focus:outline-none transition duration-300 space-y-3 cursor-pointer bg-white">
                    <!-- Platform Badge -->
                    <div
                        class="inline-flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-800 w-max">
                        ${icon}
                        <span>${account.platform}</span>
                    </div>

                    <!-- Category Title -->
                    <h1 class="text-xl font-semibold text-gray-900">
                        ${account.category || 'No Category'}
                    </h1>

                    <!-- Description -->
                    <p class="text-sm text-gray-600 line-clamp-3">
                        ${account.description || 'No description provided'}
                    </p>

                    <!-- Status Tag -->
                    <span
                        class="inline-block text-xs font-medium px-3 py-1 rounded-full border border-green-500 text-green-700 bg-green-50 w-max">
                        ${account.status || ''}
                    </span>

                    <!-- Price -->
                    <div class="text-lg font-bold text-yellow-600 mt-auto">
                      <p><strong>Price:</strong> ₦${Number(account.price).toLocaleString()}</p>
                    </div>
                </div>

    `;

      card.addEventListener("click", () => showAccountModal(account));

      if (index < initialVisibleCount || seeMoreBtn.dataset.expanded === "true") {
        showcaseContainer.appendChild(card);
      }

      visibleCount++;
    });

    seeMoreBtn.style.display = visibleCount > initialVisibleCount ? "block" : "none";
    seeMoreBtn.dataset.expanded = "false";
    seeMoreBtn.textContent = "See More";
  }


  function showAccountModal(account) {
    const modal = document.getElementById("accountModal");
    const details = document.getElementById("accountDetails");


    let badgeClass = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-xs font-semibold max-w-max';
    let icon = '';
    switch (account.platform?.toLowerCase()) {
      case 'tiktok': badgeClass += ' bg-red-500'; icon = '<i class="fab fa-tiktok"></i>'; break;
      case 'twitter': badgeClass += ' bg-black'; icon = '<i class="fab fa-twitter"></i>'; break;
      case 'facebook': badgeClass += ' bg-blue-400'; icon = '<i class="fab fa-facebook"></i>'; break;
      case 'instagram': badgeClass += ' bg-pink-600'; icon = '<i class="fab fa-instagram"></i>'; break;
      default: badgeClass += ' bg-gray-500'; icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
</svg>
`; break;
    }



    details.innerHTML = `
      <div class=" w-full">
  <!-- Account Details -->
  <div class="w-full  flex flex-col gap-2">
   <div class="${badgeClass}">  ${icon}   ${account.platform}</div>
    <p class="text-gray-700"><strong >Description:</strong>${account.description || "No description provided."}</p>
    <p><strong>Price:</strong> ₦${Number(account.price).toLocaleString()}</p>
    <p><strong>Followers:</strong> ${account.followers || "Not specified."}</p>
    <button
      class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      data-id="${account.id}"
      id="add-to-cart-btn"
    >
      Add to Cart
    </button>
  </div>
</div>

    `;
    document.querySelectorAll("#add-to-cart-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const accountId = btn.dataset.id;
        addToCart(accountId, token, btn);
      });
    });

    modal.classList.remove("hidden");
  }

  document.getElementById("closeAccountModal")?.addEventListener("click", () => {
    document.getElementById("accountModal")?.classList.add("hidden");
  });

  function showCustomAlert(message, type = "success") {
    const alertBox = document.getElementById("logoutAlert");
    const alertMsg = document.getElementById("logoutAlertMessage");

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


  async function addToCart(accountId, token, buttonElement) {
    if (!buttonElement) return;

    const originalText = buttonElement.textContent;
    buttonElement.disabled = true;
    buttonElement.textContent = "Adding to cart...";

    try {
      const response = await fetch("http://localhost:5000/api/v1/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accountId }),
      });

      const data = await response.json();

      if (data.success) {
        // ✅ Update in-memory cart with latest from backend
        user.cart = data.cart;

        buttonElement.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="white" class="w-5 h-5 inline-block mr-1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        Added
      `;

        // ✅ Update cart count in UI
        document.getElementById("cartCount").textContent = user.cart.length;
        document.getElementById("headerCartCount").textContent = user.cart.length;
        updateCartCount();

        showCustomAlert("Account added to cart!", "success");
      } else {
        buttonElement.textContent = originalText;
        showCustomAlert(data.message || "Failed to add to cart.", "error");
      }

      return data;
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

    const response = await fetch('http://localhost:5000/api/v1/cart/get', {
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
