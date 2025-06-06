

const fundAccount =  (req, res) => {
  const { amount, userId } = req.body

  if (!amount || !userId) {
    return res.status(400).json({ success: false, message: "Missing required fields" })
  }

  // Verify user id matches authenticated user or is admin
  if (req.user.id !== userId && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden" })
  }

  const users = readDataFile(USERS_FILE)
  const transactions = readDataFile(TRANSACTIONS_FILE)

  // Find user
  const userIndex = users.findIndex((user) => user.id === userId)

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  // Update user balance
  users[userIndex].balance += Number.parseFloat(amount)

  // Create transaction
  const newTransaction = {
    id: Date.now().toString(),
    userId,
    type: "fund",
    amount: Number.parseFloat(amount),
    date: new Date().toISOString().split("T")[0],
    status: "completed",
  }

  transactions.push(newTransaction)

  if (writeDataFile(USERS_FILE, users) && writeDataFile(TRANSACTIONS_FILE, transactions)) {
    return res.json({ success: true, message: "Account funded successfully", transaction: newTransaction })
  } else {
    return res.status(500).json({ success: false, message: "Failed to fund account" })
  }
}

const purchaseAccount =  (req, res) => {
  const { accountId, userId } = req.body

  if (!accountId || !userId) {
    return res.status(400).json({ success: false, message: "Missing required fields" })
  }

  console.log("Processing purchase:", { accountId, userId })

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

  // Find account
  const accountIndex = accounts.findIndex((account) => account.id === accountId)

  if (accountIndex === -1) {
    return res.status(404).json({ success: false, message: "Account not found" })
  }

  // Check if account is available
  if (accounts[accountIndex].status !== "available") {
    return res.status(400).json({ success: false, message: "Account is not available" })
  }

  // Check if user has enough balance
  if (users[userIndex].balance < accounts[accountIndex].price) {
    return res.status(400).json({ success: false, message: "Insufficient balance" })
  }

  // Update user balance
  users[userIndex].balance -= accounts[accountIndex].price

  // Update account status
  accounts[accountIndex].status = "sold"

  // Create transaction
  const newTransaction = {
    id: Date.now().toString(),
    userId,
    type: "purchase",
    amount: accounts[accountIndex].price,
    date: new Date().toISOString().split("T")[0],
    status: "completed",
  }

  // Create purchase
  const newPurchase = {
    id: Date.now().toString(),
    userId,
    accountId,
    amount: accounts[accountIndex].price,
    date: new Date().toISOString().split("T")[0],
  }

  transactions.push(newTransaction)
  purchases.push(newPurchase)

  if (
    writeDataFile(USERS_FILE, users) &&
    writeDataFile(ACCOUNTS_FILE, accounts) &&
    writeDataFile(TRANSACTIONS_FILE, transactions) &&
    writeDataFile(PURCHASES_FILE, purchases)
  ) {
    console.log("Purchase successful, saved to purchases.json")
    return res.json({
      success: true,
      message: "Purchase successful",
      transaction: newTransaction,
      purchase: newPurchase,
    })
  } else {
    return res.status(500).json({ success: false, message: "Failed to complete purchase" })
  }
}

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

export {fundAccount,purchaseAccount,addToCart,purchasesRoute}