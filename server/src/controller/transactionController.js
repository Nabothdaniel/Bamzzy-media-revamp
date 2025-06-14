




const addToCart = (req, res) => {
  const { cart, userId } = req.body

  if (!cart || !Array.isArray(cart) || cart.length === 0 || !userId) {
    return res.status(400).json({ success: false, message: "Missing required fields" })
  }

  // Verify user id matches authenticated user or is admin
  if (req.user.id !== userId && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden" })
  }

  const users = readDataFile(USERS_FILE)
  const accounts = readDataFile(ACCOUNTS_FILE)
  const transactions = readDataFile(TRANSACTIONS_FILE)
  const purchases = readDataFile(PURCHASES_FILE)

  // Find user
  const userIndex = users.findIndex((user) => user.id === userId)

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  // Find accounts and calculate total price
  const accountsToPurchase = []
  let totalPrice = 0

  for (const accountId of cart) {
    const account = accounts.find((a) => a.id === accountId)

    if (!account) {
      return res.status(404).json({ success: false, message: `Account ${accountId} not found` })
    }

    if (account.status !== "available") {
      return res.status(400).json({ success: false, message: `Account ${accountId} is not available` })
    }

    accountsToPurchase.push(account)
    totalPrice += account.price
  }

  // Check if user has enough balance
  if (users[userIndex].balance < totalPrice) {
    return res.status(400).json({ success: false, message: "Insufficient balance" })
  }

  // Update user balance
  users[userIndex].balance -= totalPrice

  // Update accounts status
  for (const account of accountsToPurchase) {
    const accountIndex = accounts.findIndex((a) => a.id === account.id)
    accounts[accountIndex].status = "sold"
  }

  // Create transaction
  const newTransaction = {
    id: Date.now().toString(),
    userId,
    type: "purchase",
    amount: totalPrice,
    date: new Date().toISOString().split("T")[0],
    status: "completed",
  }

  transactions.push(newTransaction)

  // Create purchases
  const newPurchases = accountsToPurchase.map((account) => ({
    id: Date.now().toString() + "-" + account.id,
    userId,
    accountId: account.id,
    amount: account.price,
    date: new Date().toISOString().split("T")[0],
  }))

  purchases.push(...newPurchases)

  if (
    writeDataFile(USERS_FILE, users) &&
    writeDataFile(ACCOUNTS_FILE, accounts) &&
    writeDataFile(TRANSACTIONS_FILE, transactions) &&
    writeDataFile(PURCHASES_FILE, purchases)
  ) {
    return res.json({
      success: true,
      message: "Purchase successful",
      transaction: newTransaction,
      purchases: newPurchases,
    })
  } else {
    return res.status(500).json({ success: false, message: "Failed to complete purchase" })
  }
}

 const purchasesRoute = (req, res) => {
  const purchases = readDataFile(PURCHASES_FILE)
  const accounts = readDataFile(ACCOUNTS_FILE)

  // Filter purchases by user id
  const userPurchases = purchases.filter((purchase) => purchase.userId === req.user.id)

  // Format purchases with account details
  const formattedPurchases = userPurchases.map((purchase) => {
    const account = accounts.find((account) => account.id === purchase.accountId)

    return {
      id: purchase.id,
      account: account
        ? {
            id: account.id,
            platform: account.platform,
            image: account.image,
            loginDetails: account.loginDetails,
            howToUse: account.howToUse,
          }
        : null,
      amount: purchase.amount,
      date: purchase.date,
    }
  })

  return res.json({
    success: true,
    purchases: formattedPurchases,
  })
}

export {fundAccount,addToCart,purchasesRoute}