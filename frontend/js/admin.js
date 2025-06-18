document.addEventListener('DOMContentLoaded', () => {
  // ==== Elements ====
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modal = document.getElementById('createAccountModal');
  const backdrop = document.getElementById('modalBackdrop');
  const form = document.getElementById('socialMediaForm');
  const customAlert = document.getElementById('customAlert');
  const quantityWrapper = document.getElementById("quantityWrapper");

  const showAddPlatformBtn = document.getElementById("showAddPlatform");
  const addPlatformForm = document.getElementById("addPlatformForm");
  const newPlatformInput = document.getElementById("newPlatform");
  const addPlatformBtn = document.getElementById("addPlatformBtn");
  const platformSelect = document.getElementById("platform");

  const showAddCategoryBtn = document.getElementById("showAddCategory");
  const addCategoryForm = document.getElementById("addCategoryForm");
  const newCategoryInput = document.getElementById("newCategory");
  const addCategoryBtn = document.getElementById("addCategoryBtn");
  const categorySelect = document.getElementById("category");

  const singleTab = document.getElementById("singleTab");
  const bulkTab = document.getElementById("bulkTab");
  const singleEntry = document.getElementById("singleEntry");
  const bulkEntry = document.getElementById("bulkEntry");
  let currentMode = "single"; // default
  const BASE_URL = "https://bamzzy-media-revamp.onrender.com";


  // ==== Utils ====
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

  function showCustomAlert(message, duration = 3000) {
    customAlert.textContent = message;
    customAlert.classList.remove('hidden', 'opacity-0');
    customAlert.classList.add('opacity-100');
    setTimeout(() => {
      customAlert.classList.add('opacity-0');
      setTimeout(() => {
        customAlert.classList.add('hidden');
        customAlert.classList.remove('opacity-100');
      }, 300);
    }, duration);
  }

  // ==== Modal Actions ====
  openModalBtn?.addEventListener('click', () => {
    modal.classList.remove('hidden');
    backdrop.classList.remove('hidden');
  });

  closeModalBtn?.addEventListener('click', () => {
    modal.classList.add('hidden');
    backdrop.classList.add('hidden');
  });

  backdrop?.addEventListener('click', () => {
    modal.classList.add('hidden');
    backdrop.classList.add('hidden');
  });

  const submitBtn = document.getElementById('submitBtn');

  // Sanitize input to prevent XSS and malicious input
  function sanitizeInput(str) {
    return str
      ?.replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;")
      .trim();
  }

  // ==== Form Submission ====
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentMode = bulkEntry.classList.contains("hidden") ? "single" : "bulk";

    // 🆕 Sanitize shared description based on mode
    let description = "";
    if (currentMode === "bulk") {
      const bulkDesc = document.getElementById("bulkDescription").value.trim();
      description = sanitizeInput(bulkDesc);
    } else {
      const singleDesc = document.getElementById("singleDescription").value.trim();
      description = sanitizeInput(singleDesc);
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

    const token = getSessionData().token;
    if (!token) {
      showCustomAlert("You are not authenticated.");
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
      return;
    }

    const platform = sanitizeInput(platformSelect.value);
    const category = sanitizeInput(categorySelect.value);
    const price = parseFloat(document.getElementById('price').value);
    const quantityInput = parseInt(document.getElementById('quantity').value);

    if (!platform || !category || isNaN(price)) {
      showCustomAlert("Please fill all required fields.");
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
      return;
    }

    let payload = {
      platform,
      category,
      price,
      quantity: 1,
      accounts: [],
      description
    };

    if (currentMode === "bulk") {
      if (isNaN(quantityInput) || quantityInput <= 0) {
        showCustomAlert("Please enter a valid quantity for bulk.");
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
        return;
      }

      const bulkText = document.getElementById("bulkAccounts").value.trim();
      const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        showCustomAlert("Bulk data is empty.");
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
        return;
      }

      payload.quantity = quantityInput;
      payload.accounts = lines.map(line => {
        const [username, password, twoFactor, mail, mailPassword] = line.split("|");
        return {
          username: sanitizeInput(username),
          password: sanitizeInput(password),
          twoFactor: sanitizeInput(twoFactor),
          mail: sanitizeInput(mail),
          mailPassword: sanitizeInput(mailPassword)
        };
      });
    } else {
      const username = sanitizeInput(document.getElementById("login").value);
      const password = sanitizeInput(document.getElementById("password").value);
      const twoFactor = sanitizeInput(document.getElementById("twoFactor").value);
      const mail = sanitizeInput(document.getElementById("mail").value);
      const mailPassword = sanitizeInput(document.getElementById("mail-password").value);

      if (!username || !password) {
        showCustomAlert("Username and password are required.");
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
        return;
      }

      payload.accounts.push({
        username,
        password,
        twoFactor,
        mail,
        mailPassword
      });
    }

    try {
      const response = await fetch(`${BASE_URL}/api/v1/accounts/create-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        showCustomAlert("Account(s) created successfully!");
        form.reset();
        modal.classList.add('hidden');
        backdrop.classList.add('hidden');
      } else {
        showCustomAlert(result.message || "Error occurred.");
      }
    } catch (err) {
      console.error(err);
      showCustomAlert("Network error.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });


  // ==== Fetch Functions ====
  async function fetchPlatforms() {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/platforms/get-platforms`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const { platforms } = await res.json();
      platformSelect.innerHTML = `<option value="">Select Platform</option>`;
      platforms.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.name;
        opt.textContent = p.name;
        platformSelect.appendChild(opt);
      });
    } catch (err) {
      console.error("Error fetching platforms:", err);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/categories/get-categories`, {
        method: "GET",
        headers: getAuthHeaders()
      });
      const { categories } = await res.json();
      categorySelect.innerHTML = `<option value="">Select Category</option>`;
      categories.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.name;
        opt.textContent = c.name;
        categorySelect.appendChild(opt);
      });
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }

  async function fetchAdminStats() {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/get-admin-stats`, {
        method: "GET",
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        const stats = data.stats;
        document.getElementById('totalUsers').textContent = stats.totalUsers.toLocaleString();
        document.getElementById('accountsSold').textContent = stats.accountsSold.toLocaleString();
        document.getElementById('totalRevenue').textContent = `₦${Number(stats.totalRevenue).toLocaleString(undefined, {
          minimumFractionDigits: 2
        })}`;
      }
    } catch (err) {
      console.error("Error fetching admin stats:", err);
    }
  }

  // ==== Add Platform ====
  addPlatformBtn?.addEventListener("click", async () => {
    const name = newPlatformInput.value.trim();
    if (!name) return alert("Platform name required.");
    try {
      const res = await fetch(`${BASE_URL}/api/v1/platforms/add-platform`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (res.ok) {
        newPlatformInput.value = "";
        addPlatformBtn.classList.add("hidden");
        fetchPlatforms();
      } else {
        alert(data.message || "Failed to add platform.");
      }
    } catch (err) {
      console.error("Error adding platform:", err);
    }
  });

  // ==== Add Category ====
  addCategoryBtn?.addEventListener("click", async () => {
    const name = newCategoryInput.value.trim();
    if (!name) return alert("Category name required.");
    try {
      const res = await fetch(`${BASE_URL}/api/v1/categories/create-category`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (res.ok) {
        newCategoryInput.value = "";
        addCategoryBtn.classList.add("hidden");
        fetchCategories();
      } else {
        alert(data.message || "Failed to add category.");
      }
    } catch (err) {
      console.error("Error adding category:", err);
    }
  });

  // ==== Input Watchers ====
  newPlatformInput?.addEventListener("input", () => {
    addPlatformBtn.classList.toggle("hidden", newPlatformInput.value.trim() === "");
  });

  newCategoryInput?.addEventListener("input", () => {
    addCategoryBtn.classList.toggle("hidden", newCategoryInput.value.trim() === "");
  });


  // === Toggle Add Platform Form ===
  showAddPlatformBtn?.addEventListener("click", () => {
    addPlatformForm.classList.toggle("hidden");
  });

  // === Toggle Add Category Form ===
  showAddCategoryBtn?.addEventListener("click", () => {
    addCategoryForm.classList.toggle("hidden");
  });


  // ==== Tab Switching ====
  singleTab?.addEventListener("click", () => {
    currentMode = "single"; // track active tab
    singleEntry.classList.remove("hidden");
    bulkEntry.classList.add("hidden");
    // ... rest of class handling
  });

  bulkTab?.addEventListener("click", () => {
    currentMode = "bulk"; //
    bulkEntry.classList.remove("hidden");
    singleEntry.classList.add("hidden");
    // Show quantity on bulk

    quantityWrapper?.classList.remove("hidden");
  });

  // ==== Initial Load ====
  fetchAdminStats();
  fetchPlatforms();
  fetchCategories();
});
