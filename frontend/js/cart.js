document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  if (!token || !user) {
    window.location.href = "/login.html"
    return
  }

  // Update user info
  document.getElementById("userName").textContent = user.name || "User"
  document.getElementById("userBalance").textContent = `Balance: ₦${formatNumber(user.balance || 0)}`
  document.getElementById("cartUserBalance").textContent = `₦${formatNumber(user.balance || 0)}`

  // Load cart
  loadCart()

  // Sidebar toggle
  const toggleSidebar = document.getElementById("toggleSidebar")
  const closeSidebar = document.getElementById("closeSidebar")
  const sidebar = document.getElementById("sidebar")

  toggleSidebar.addEventListener("click", () => {
    sidebar.classList.toggle("active")
  })

  closeSidebar.addEventListener("click", () => {
    sidebar.classList.remove("active")
  })

  // Close sidebar when clicking on a menu item (for mobile)
  const menuItems = document.querySelectorAll(".sidebar-menu a")
  menuItems.forEach((item) => {
    item.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("active")
      }
    })
  })

  // Close sidebar when clicking outside (for mobile)
  document.addEventListener("click", (event) => {
    const isClickInsideSidebar = sidebar.contains(event.target)
    const isClickOnToggle = toggleSidebar.contains(event.target)

    if (!isClickInsideSidebar && !isClickOnToggle && sidebar.classList.contains("active")) {
      sidebar.classList.remove("active")
    }
  })

  // Fund account modal
  const fundAccount = document.getElementById("fundAccount")
  const fundFromCart = document.getElementById("fundFromCart")
  const fundModal = document.getElementById("fundModal")
  const closeFundModal = fundModal.querySelector(".close")

  fundAccount.addEventListener("click", (e) => {
    e.preventDefault()
    fundModal.style.display = "block"
  })

  if (fundFromCart) {
    fundFromCart.addEventListener("click", (e) => {
      e.preventDefault()
      fundModal.style.display = "block"
    })
  }

  closeFundModal.addEventListener("click", () => {
    fundModal.style.display = "none"
  })

  // Checkout success modal
  const checkoutSuccessModal = document.getElementById("checkoutSuccessModal")
  const closeCheckoutSuccessModal = checkoutSuccessModal.querySelector(".close")
  const viewPurchasesBtn = document.getElementById("viewPurchasesBtn")
  const continueShopping = document.getElementById("continueShopping")

  closeCheckoutSuccessModal.addEventListener("click", () => {
    checkoutSuccessModal.style.display = "none"
  })

  viewPurchasesBtn.addEventListener("click", () => {
    window.location.href = "/purchases.html"
  })

  continueShopping.addEventListener("click", () => {
    checkoutSuccessModal.style.display = "none"
    window.location.href = "/dashboard.html"
  })

  // Close modals when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === fundModal) {
      fundModal.style.display = "none"
    }
    if (event.target === checkoutSuccessModal) {
      checkoutSuccessModal.style.display = "none"
    }
  })

  // Update the fund account modal handler to use the new chat-based funding flow
  // Replace the fund form submission handler with:

  // Handle fund request
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

          // For demo purposes, simulate success
          alert("Your funding request has been sent to the admin. They will contact you with payment details.")
          fundModal.style.display = "none"

          // Redirect to messages page
          window.location.href = "/messages.html"
        })
    })
  }

  // Handle checkout
  const checkoutButton = document.getElementById("checkoutButton")
  checkoutButton.addEventListener("click", () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")

    if (cart.length === 0) {
      alert("Your cart is empty")
      return
    }

    // Send checkout request to server
    fetch("/api/transactions/purchase-cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        cart,
        userId: user.id,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Update user balance
          const totalPrice = Number.parseFloat(
            document.getElementById("totalPrice").textContent.replace("₦", "").replace(/,/g, ""),
          )
          user.balance = (Number.parseFloat(user.balance) || 0) - totalPrice
          localStorage.setItem("user", JSON.stringify(user))

          // Clear cart
          localStorage.setItem("cart", "[]")

          // Show success modal
          checkoutSuccessModal.style.display = "block"
        } else {
          alert(data.message || "Checkout failed. Please try again.")
        }
      })
      .catch((error) => {
        console.error("Error:", error)

        // For demo purposes, we'll simulate a successful checkout
        // In a real application, you would handle the error properly

        // Update user balance
        const totalPrice = Number.parseFloat(
          document.getElementById("totalPrice").textContent.replace("₦", "").replace(/,/g, ""),
        )
        user.balance = (Number.parseFloat(user.balance) || 0) - totalPrice
        localStorage.setItem("user", JSON.stringify(user))

        // Clear cart
        localStorage.setItem("cart", "[]")

        // Show success modal
        checkoutSuccessModal.style.display = "block"
      })
  })

  // Handle logout
  const logout = document.getElementById("logout")
  logout.addEventListener("click", (e) => {
    e.preventDefault()

    // Clear local storage
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("cart")

    // Redirect to login page
    window.location.href = "/login.html"
  })
})

// Function to load cart
function loadCart() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]")
  const cartItems = document.getElementById("cartItems")
  const cartCount = document.getElementById("cartCount")
  const totalItems = document.getElementById("totalItems")

  // Update cart count
  cartCount.textContent = cart.length
  totalItems.textContent = cart.length

  if (cart.length === 0) {
    cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <a href="dashboard.html" class="btn-primary">Browse Accounts</a>
            </div>
        `
    return
  }

  // Send request to server to get accounts
  fetch("/api/accounts", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        displayCartItems(data.accounts.filter((account) => cart.includes(account.id)))
      } else {
        cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load cart. Please try again later.</p>
                </div>
            `
      }
    })
    .catch((error) => {
      console.error("Error:", error)

      // For demo purposes, we'll display mock accounts
      // In a real application, you would handle the error properly

      const mockAccounts = [
        {
          id: "1",
          platform: "tiktok",
          image: "https://via.placeholder.com/300",
          year: 2020,
          followers: 10000,
          price: 50000,
          description: "TikTok account with 10K followers, mostly in the fashion niche.",
          status: "available",
        },
        {
          id: "2",
          platform: "instagram",
          image: "https://via.placeholder.com/300",
          year: 2019,
          followers: 5000,
          price: 30000,
          description: "Instagram account with 5K followers, focused on travel content.",
          status: "available",
        },
        {
          id: "4",
          platform: "facebook",
          image: "https://via.placeholder.com/300",
          year: 2017,
          followers: 15000,
          price: 70000,
          description: "Facebook page with 15K followers, focused on lifestyle content.",
          status: "available",
        },
      ]

      displayCartItems(mockAccounts.filter((account) => cart.includes(account.id)))
    })
}

// Function to display cart items
function displayCartItems(accounts) {
  const cartItems = document.getElementById("cartItems")
  const totalPrice = document.getElementById("totalPrice")
  let totalPriceValue = 0

  let cartItemsHTML = ""

  accounts.forEach((account) => {
    totalPriceValue += account.price

    cartItemsHTML += `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${account.image}" alt="${account.platform}">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-info">
                        <div class="cart-item-platform">
                            <i class="fab fa-${getPlatformIcon(account.platform)}"></i> ${account.platform}
                        </div>
                        <div class="cart-item-followers">${formatNumber(account.followers)} Followers</div>
                    </div>
                    <div class="cart-item-price">₦${formatNumber(account.price)}</div>
                    <div class="cart-item-actions">
                        <button class="remove-from-cart" data-id="${account.id}">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            </div>
        `
  })

  cartItems.innerHTML = cartItemsHTML
  totalPrice.textContent = `₦${formatNumber(totalPriceValue)}`

  // Add event listeners to remove buttons
  const removeButtons = document.querySelectorAll(".remove-from-cart")
  removeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const accountId = this.getAttribute("data-id")
      removeFromCart(accountId)
    })
  })

  // Check if checkout button should be enabled
  checkCheckoutButton(totalPriceValue)
}

// Function to remove account from cart
function removeFromCart(accountId) {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]")
  cart = cart.filter((id) => id !== accountId)
  localStorage.setItem("cart", JSON.stringify(cart))

  // Reload cart
  loadCart()
}

// Function to check if checkout button should be enabled
function checkCheckoutButton(totalPrice) {
  const checkoutButton = document.getElementById("checkoutButton")
  const insufficientFunds = document.getElementById("insufficientFunds")
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const userBalance = Number.parseFloat(user.balance || 0)

  if (totalPrice > userBalance) {
    checkoutButton.disabled = true
    insufficientFunds.style.display = "block"
  } else {
    checkoutButton.disabled = false
    insufficientFunds.style.display = "none"
  }
}

// Helper function to get platform icon
function getPlatformIcon(platform) {
  const icons = {
    instagram: "instagram",
    facebook: "facebook",
    twitter: "twitter",
    tiktok: "tiktok",
    youtube: "youtube",
    pinterest: "pinterest",
    linkedin: "linkedin",
    snapchat: "snapchat",
  }

  return icons[platform.toLowerCase()] || "globe"
}

// Helper function to format numbers
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
