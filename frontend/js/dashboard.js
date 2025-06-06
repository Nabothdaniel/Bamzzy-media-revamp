document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  if (!token || !user) {
    window.location.href = "/login.html"
    return
  }

  // Update user info in sidebar
  const userNameElements = document.querySelectorAll("#userName")
  const userBalanceElements = document.querySelectorAll("#userBalance")

  userNameElements.forEach((element) => {
    element.textContent = user.name || "User"
  })

  userBalanceElements.forEach((element) => {
    element.textContent = `₦${formatNumber(user.balance || 0)}`
  })

  // Update cart count
  const cart = JSON.parse(localStorage.getItem("cart") || "[]")
  const cartCountElements = document.querySelectorAll("#cartCount, #headerCartCount")

  cartCountElements.forEach((element) => {
    element.textContent = cart.length
  })

  // Handle logout
  const logoutBtn = document.getElementById("logout")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault()
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login.html"
    })
  }

  // Handle mobile sidebar toggle
  const hamburgerMenu = document.querySelector(".hamburger-menu")
  const sidebar = document.querySelector(".sidebar")

  if (hamburgerMenu && sidebar) {
    hamburgerMenu.addEventListener("click", () => {
      sidebar.classList.toggle("active")
    })
  }

  // Function to close sidebar on mobile after selection
  function closeSidebarOnMobile() {
    if (window.innerWidth <= 768 && sidebar.classList.contains("active")) {
      sidebar.classList.remove("active")
    }
  }

  // Add click event to all sidebar menu items
  const sidebarMenuItems = document.querySelectorAll(".sidebar .menu li a")
  sidebarMenuItems.forEach((item) => {
    item.addEventListener("click", () => {
      closeSidebarOnMobile()
    })
  })

  // Handle fund account modal
  const fundAccountBtn = document.getElementById("fundAccount")
  const fundModal = document.getElementById("fundModal")
  const closeModalBtns = document.querySelectorAll(".close")

  if (fundAccountBtn && fundModal) {
    fundAccountBtn.addEventListener("click", (e) => {
      e.preventDefault()
      fundModal.style.display = "block"
    })
  }

  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const modal = this.closest(".modal")
      if (modal) {
        modal.style.display = "none"
      }
    })
  })

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none"
    }
  })

  // Handle payment method toggle
  const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]')
  const bankDetails = document.getElementById("bankDetails")
  const cardDetails = document.getElementById("cardDetails")

  // Handle send fund request
  const sendFundRequestBtn = document.getElementById("sendFundRequest")
  if (sendFundRequestBtn) {
    sendFundRequestBtn.addEventListener("click", () => {
      const amount = document.getElementById("fundAmount").value

      if (!amount || isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount")
        return
      }

      // Send message to admin
      fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: "1", // Admin ID
          message: `I would like to fund my account with ₦${amount}. My user ID is ${user.id}.`,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            alert("Your funding request has been sent to the admin. They will contact you with payment details.")
            fundModal.style.display = "none"

            // Redirect to messages page
            window.location.href = "/messages.html"
          } else {
            alert(data.message || "Failed to send request. Please try again.")
          }
        })
        .catch((error) => {
          console.error("Error:", error)
          alert("An error occurred. Please try again.")
        })
    })
  }

  // Check for unread messages
  checkUnreadMessages()

  // Function to check for unread messages
  function checkUnreadMessages() {
    fetch("/api/messages", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const totalUnread = data.conversations.reduce((total, conv) => total + conv.unreadCount, 0)
          updateUnreadMessageCount(totalUnread)
        }
      })
      .catch((error) => {
        console.error("Error:", error)
      })
  }

  // Function to update unread message count
  function updateUnreadMessageCount(count) {
    const unreadCountElements = document.querySelectorAll("#unreadCount, #headerUnreadCount")

    unreadCountElements.forEach((element) => {
      if (count > 0) {
        element.textContent = count
        element.style.display = "inline-flex"
      } else {
        element.style.display = "none"
      }
    })
  }

  // Load accounts
  const accountsGrid = document.getElementById("accountsGrid")
  if (accountsGrid) {
    // Show loading state
    accountsGrid.innerHTML =
      "<div class='loading-spinner'><i class='fas fa-spinner fa-spin'></i> Loading accounts...</div>"

    // Fetch accounts from server
    fetch("/api/accounts", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.accounts) {
          renderAccounts(data.accounts)
        } else {
          // Fallback to mock data for demo
          const mockAccounts = getMockAccounts()
          renderAccounts(mockAccounts)
        }
      })
      .catch((error) => {
        console.error("Error:", error)
        // Fallback to mock data for demo
        const mockAccounts = getMockAccounts()
        renderAccounts(mockAccounts)
      })
  }

  // Handle platform filters
  const filterButtons = document.querySelectorAll(".filter-btn")
  if (filterButtons.length) {
    filterButtons.forEach((button) => {
      button.addEventListener("click", function () {
        // Remove active class from all buttons
        filterButtons.forEach((btn) => btn.classList.remove("active"))

        // Add active class to clicked button
        this.classList.add("active")

        const platform = this.dataset.platform

        // Filter accounts
        filterAccounts(platform)
      })
    })
  }

  // Function to render accounts
  function renderAccounts(accounts) {
    if (!accountsGrid) return

    if (accounts.length === 0) {
      accountsGrid.innerHTML =
        "<p class='no-accounts'>No accounts available at the moment. Please check back later.</p>"
      return
    }

    accountsGrid.innerHTML = ""

    accounts.forEach((account) => {
      const card = document.createElement("div")
      card.className = "account-card"
      card.dataset.platform = account.platform

      const statusClass = account.status === "available" ? "status-available" : "status-sold"
      const statusText = account.status === "available" ? "Available" : "Sold Out"
      const statusIcon =
        account.status === "available" ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>'

      card.innerHTML = `
                <div class="account-image-container">
                    <img src="${account.image}" alt="${account.platform} Account" class="account-image">
                </div>
                <div class="account-info">
                    <div class="account-platform">
                        <i class="fab fa-${account.platform}"></i>
                        <span>${account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}</span>
                    </div>
                    <h3 class="account-title">${account.platform.charAt(0).toUpperCase() + account.platform.slice(1)} Account</h3>
                    <p class="account-price">₦${formatNumber(account.price.toFixed(2))}</p>
                    <div class="account-status ${statusClass}">
                        ${statusIcon} ${statusText}
                    </div>
                    <div class="account-actions">
                        <button class="btn btn-primary view-account" data-id="${account.id}">View Details</button>
                        ${
                          account.status === "available"
                            ? `<button class="btn btn-secondary add-to-cart" data-id="${account.id}">
                                <i class="fas fa-cart-plus"></i> Add to Cart
                            </button>`
                            : ""
                        }
                    </div>
                </div>
            `

      accountsGrid.appendChild(card)
    })

    // Add event listeners to buttons
    addAccountButtonListeners()
  }

  // Function to filter accounts
  function filterAccounts(platform) {
    const accountCards = document.querySelectorAll(".account-card")

    accountCards.forEach((card) => {
      if (platform === "all" || card.dataset.platform === platform) {
        card.style.display = "block"
      } else {
        card.style.display = "none"
      }
    })
  }

  // Function to add event listeners to account buttons
  function addAccountButtonListeners() {
    // View account details
    const viewButtons = document.querySelectorAll(".view-account")
    viewButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const accountId = this.dataset.id
        viewAccountDetails(accountId)
      })
    })

    // Add to cart
    const addToCartButtons = document.querySelectorAll(".add-to-cart")
    addToCartButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const accountId = this.dataset.id
        addToCart(accountId)
      })
    })
  }

  // Function to get mock accounts for demo purposes
  function getMockAccounts() {
    return [
      {
        id: "1",
        platform: "instagram",
        image: "/web/media2.png",
        price: 50000,
        status: "available",
        description: "Premium Instagram account with 50K followers. Perfect for influencers and businesses.",
        loginDetails: "Username: insta_premium\nPassword: secure_pass123\nEmail: premium@example.com",
        howToUse:
          "1. Login with the provided credentials\n2. Change the password immediately\n3. Update the recovery email\n4. Start posting content regularly",
      },
      {
        id: "2",
        platform: "facebook",
        image: "/web/media3.png",
        price: 35000,
        status: "available",
        description: "Established Facebook page with 25K likes. Great engagement rate.",
        loginDetails: "Email: fb_page@example.com\nPassword: fb_secure_2023",
        howToUse:
          "1. Login to Facebook with the credentials\n2. Change the password\n3. Update page information\n4. Start posting content",
      },
      {
        id: "3",
        platform: "twitter",
        image: "/web/hero-image.png",
        price: 40000,
        status: "available",
        description: "Twitter account with 30K followers. Verified account with high engagement.",
        loginDetails: "Username: twitter_verified\nPassword: tw_pass_2023\nEmail: twitter@example.com",
        howToUse:
          "1. Login with the provided credentials\n2. Change the password immediately\n3. Update profile information\n4. Start tweeting regularly",
      },
      {
        id: "4",
        platform: "tiktok",
        image: "/web/logo.png",
        price: 60000,
        status: "available",
        description: "TikTok account with 100K followers. Trending content creator.",
        loginDetails: "Username: tiktok_trending\nPassword: tiktok_secure_2023\nEmail: tiktok@example.com",
        howToUse:
          "1. Login with the provided credentials\n2. Change the password immediately\n3. Update profile information\n4. Start creating content",
      },
    ]
  }

  // Function to view account details
  function viewAccountDetails(accountId) {
    // Fetch account details from server
    fetch(`/api/accounts/${accountId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.account) {
          displayAccountModal(data.account)
        } else {
          // Fallback to mock data
          const mockAccounts = getMockAccounts()
          const account = mockAccounts.find((acc) => acc.id === accountId)
          if (account) {
            displayAccountModal(account)
          } else {
            alert("Account details not found.")
          }
        }
      })
      .catch((error) => {
        console.error("Error:", error)
        // Fallback to mock data
        const mockAccounts = getMockAccounts()
        const account = mockAccounts.find((acc) => acc.id === accountId)
        if (account) {
          displayAccountModal(account)
        } else {
          alert("An error occurred. Please try again.")
        }
      })
  }

  // Function to display account modal
  function displayAccountModal(account) {
    const accountModal = document.getElementById("accountModal")
    const accountDetails = document.getElementById("accountDetails")

    if (accountModal && accountDetails) {
      const statusClass = account.status === "available" ? "status-available" : "status-sold"
      const statusText = account.status === "available" ? "Available" : "Sold Out"
      const statusIcon =
        account.status === "available" ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>'

      accountDetails.innerHTML = `
      <div class="account-detail-header">
        <div class="account-detail-image-container">
          <img src="${account.image}" alt="${account.platform} Account" class="account-detail-image">
        </div>
        <div class="account-detail-info">
          <div class="account-platform">
            <i class="fab fa-${account.platform}"></i>
            <span>${account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}</span>
          </div>
          <h2>${account.platform.charAt(0).toUpperCase() + account.platform.slice(1)} Account</h2>
          <p class="account-price">₦${formatNumber(account.price)}</p>
          <div class="account-status ${statusClass}">
            ${statusIcon} ${statusText}
          </div>
        </div>
      </div>
      <div class="account-detail-description">
        <h3>Description</h3>
        <p>${account.description}</p>
      </div>
      ${
        account.status === "available"
          ? `<div class="account-detail-actions">
              <button class="btn btn-primary buy-now" data-id="${account.id}">Buy Now</button>
              <button class="btn btn-secondary add-to-cart-modal" data-id="${account.id}">
                <i class="fas fa-cart-plus"></i> Add to Cart
              </button>
            </div>`
          : ""
      }
    `

      accountModal.style.display = "block"

      // Add event listeners to buttons
      const buyNowBtn = accountDetails.querySelector(".buy-now")
      if (buyNowBtn) {
        buyNowBtn.addEventListener("click", function () {
          const accountId = this.dataset.id
          buyNow(accountId)
        })
      }

      const addToCartModalBtn = accountDetails.querySelector(".add-to-cart-modal")
      if (addToCartModalBtn) {
        addToCartModalBtn.addEventListener("click", function () {
          const accountId = this.dataset.id
          addToCart(accountId)
          accountModal.style.display = "none"
        })
      }
    }
  }

  // Function to add account to cart
  function addToCart(accountId) {
    // Fetch account details from server
    fetch(`/api/accounts/${accountId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.account) {
          processAddToCart(data.account)
        } else {
          // Fallback to mock data
          const mockAccounts = getMockAccounts()
          const account = mockAccounts.find((acc) => acc.id === accountId)
          if (account) {
            processAddToCart(account)
          } else {
            alert("Failed to add account to cart.")
          }
        }
      })
      .catch((error) => {
        console.error("Error:", error)
        // Fallback to mock data
        const mockAccounts = getMockAccounts()
        const account = mockAccounts.find((acc) => acc.id === accountId)
        if (account) {
          processAddToCart(account)
        } else {
          alert("An error occurred. Please try again.")
        }
      })
  }

  // Function to process adding to cart
  function processAddToCart(account) {
    // Check if account is available
    if (account.status !== "available") {
      alert("This account is no longer available.")
      return
    }

    // Get current cart
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")

    // Check if account is already in cart
    const existingItem = cart.find((item) => item.id === account.id)
    if (existingItem) {
      alert("This account is already in your cart.")
      return
    }

    // Add account to cart
    cart.push(account)
    localStorage.setItem("cart", JSON.stringify(cart))

    // Update cart count
    const cartCountElements = document.querySelectorAll("#cartCount, #headerCartCount")
    cartCountElements.forEach((element) => {
      element.textContent = cart.length
    })

    alert("Account added to cart!")
  }

  // Function to buy account directly
  function buyNow(accountId) {
    // Fetch account details from server
    fetch(`/api/accounts/${accountId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.account) {
          processBuyNow(data.account)
        } else {
          // Fallback to mock data
          const mockAccounts = getMockAccounts()
          const account = mockAccounts.find((acc) => acc.id === accountId)
          if (account) {
            processBuyNow(account)
          } else {
            alert("Failed to process purchase.")
          }
        }
      })
      .catch((error) => {
        console.error("Error:", error)
        // Fallback to mock data
        const mockAccounts = getMockAccounts()
        const account = mockAccounts.find((acc) => acc.id === accountId)
        if (account) {
          processBuyNow(account)
        } else {
          alert("An error occurred. Please try again.")
        }
      })
  }

  // Function to process buy now
  function processBuyNow(account) {
    // Check if account is available
    if (account.status !== "available") {
      alert("This account is no longer available.")
      return
    }

    // Check if user has enough balance
    if (user.balance < account.price) {
      alert("Insufficient balance. Please fund your account.")
      return
    }

    // Confirm purchase
    if (
      confirm(`Are you sure you want to purchase this ${account.platform} account for ₦${formatNumber(account.price)}?`)
    ) {
      // Create purchase record
      const purchase = {
        id: Date.now().toString(),
        userId: user.id,
        accountId: account.id,
        amount: account.price,
        date: new Date().toISOString(),
      }

      // Save purchase to localStorage for demo purposes
      const purchases = JSON.parse(localStorage.getItem("purchases") || "[]")
      purchases.push(purchase)
      localStorage.setItem("purchases", JSON.stringify(purchases))

      // Also save to userPurchases for the purchases page
      const userPurchases = JSON.parse(localStorage.getItem("userPurchases") || "[]")
      userPurchases.push({
        id: purchase.id,
        account: account,
        amount: account.price,
        date: purchase.date,
      })
      localStorage.setItem("userPurchases", JSON.stringify(userPurchases))

      // Save accounts to localStorage for demo purposes
      const accounts = JSON.parse(localStorage.getItem("accounts") || "[]")
      if (!accounts.some((a) => a.id === account.id)) {
        accounts.push(account)
      } else {
        // Update account status to sold
        const index = accounts.findIndex((a) => a.id === account.id)
        accounts[index] = { ...account, status: "sold" }
      }
      localStorage.setItem("accounts", JSON.stringify(accounts))

      // Send purchase to server API
      fetch("/api/transactions/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountId: account.id,
          userId: user.id,
        }),
      }).catch((error) => {
        console.error("Error saving purchase to server:", error)
        // Continue with local purchase flow even if server fails
      })

      // Update user balance
      user.balance -= account.price
      localStorage.setItem("user", JSON.stringify(user))

      // Update displayed balance
      userBalanceElements.forEach((element) => {
        element.textContent = `₦${formatNumber(user.balance || 0)}`
      })

      alert(`Purchase successful! You can view the login details in your purchase history.`)

      // Close modal
      const accountModal = document.getElementById("accountModal")
      if (accountModal) {
        accountModal.style.display = "none"
      }

      // Refresh accounts
      location.reload()
    }
  }

  // Check for unread messages periodically
  setInterval(checkUnreadMessages, 30000) // Check every 30 seconds

  // Function to format number with commas
  function formatNumber(number) {
    return Number.parseFloat(number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
})
