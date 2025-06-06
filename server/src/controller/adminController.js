

const adminStats = (req, res) => {
  const accounts = readDataFile(ACCOUNTS_FILE)
  const users = readDataFile(USERS_FILE)
  const transactions = readDataFile(TRANSACTIONS_FILE)
  const messages = readDataFile(MESSAGES_FILE)

  const totalAccounts = accounts.length
  const accountsSold = accounts.filter((account) => account.status === "sold").length

  // Calculate total revenue from purchase transactions
  const totalRevenue = transactions
    .filter((transaction) => transaction.type === "purchase")
    .reduce((total, transaction) => total + transaction.amount, 0)

  const totalUsers = users.filter((user) => user.role === "user").length

  // Count unread messages for admin
  const unreadMessages = messages.filter((msg) => msg.receiverId === "1" && !msg.read).length

  return res.json({
    success: true,
    stats: {
      totalAccounts,
      accountsSold,
      totalRevenue,
      totalUsers,
      unreadMessages,
    },
  })
}

const adminActvity =  (req, res) => {
  const transactions = readDataFile(TRANSACTIONS_FILE)
  const users = readDataFile(USERS_FILE)
  const accounts = readDataFile(ACCOUNTS_FILE)
  const messages = readDataFile(MESSAGES_FILE)

  // Get recent transactions
  const recentTransactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)

  // Format activity items
  const activity = recentTransactions
    .map((transaction) => {
      const user = users.find((user) => user.id === transaction.userId)

      if (transaction.type === "fund") {
        return {
          type: "user",
          title: `${user ? user.name : "Unknown user"} funded their account`,
          time: transaction.date,
          amount: transaction.amount,
        }
      } else if (transaction.type === "purchase") {
        return {
          type: "sale",
          title: `${user ? user.name : "Unknown user"} purchased an account`,
          time: transaction.date,
          amount: transaction.amount,
        }
      }
      return null
    })
    .filter((item) => item !== null)

  // Add recent account additions
  const recentAccounts = accounts.sort((a, b) => Number.parseInt(b.id) - Number.parseInt(a.id)).slice(0, 3)

  recentAccounts.forEach((account) => {
    activity.push({
      type: "account",
      title: `New ${account.platform} account added`,
      time: "Recently",
      amount: account.price,
    })

    // Add recent messages
  const recentMessages = messages
    .filter((msg) => msg.receiverId === "1")
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 3)

  recentMessages.forEach((message) => {
    const user = users.find((user) => user.id === message.senderId)
    activity.push({
      type: "message",
      title: `New message from ${user ? user.name : "Unknown user"}`,
      time: new Date(message.timestamp).toLocaleDateString(),
      read: message.read,
    })
  })

  // Sort by most recent
  activity.sort((a, b) => {
    if (a.time === "Recently") return -1
    if (b.time === "Recently") return 1
    return new Date(b.time) - new Date(a.time)
  })

  return res.json({
    success: true,
    activity: activity.slice(0, 5),
  })
  })
}


const checkTransactions =  (req, res) => {
  const transactions = readDataFile(TRANSACTIONS_FILE)
  const users = readDataFile(USERS_FILE)

  // Format transactions
  const formattedTransactions = transactions.map((transaction) => {
    const user = users.find((user) => user.id === transaction.userId)

    return {
      id: transaction.id,
      user: user ? user.name : "Unknown",
      type: transaction.type,
      amount: transaction.amount,
      date: transaction.date,
      status: transaction.status,
    }
  })

  return res.json({
    success: true,
    transactions: formattedTransactions,
  })
}

const getUsers =  (req, res) => {
  console.log("Fetching users from:", USERS_FILE)
  try {
    // Check if file exists
    if (!fs.existsSync(USERS_FILE)) {
      console.log("Users file does not exist, creating it...")
      const defaultUsers = [
        {
          id: "1",
          name: "Admin User",
          email: "bamzymediatv@gmail.com",
          password: hashPassword("babcute1000"),
          role: "admin",
          balance: Number.POSITIVE_INFINITY,
          joined: "2023-01-01",
        },
        {
          id: "2",
          name: "Test User",
          email: "user@example.com",
          password: hashPassword("user123"),
          role: "user",
          balance: 100,
          joined: "2023-01-02",
        },
      ]
      writeDataFile(USERS_FILE, defaultUsers)
    }

    const users = readDataFile(USERS_FILE)
    console.log("Users found:", users.length)

    // Format users (remove passwords)
    const formattedUsers = users.map((user) => {
      const { password, ...userData } = user
      return userData
    })

    return res.json({
      success: true,
      users: formattedUsers,
    })
  } catch (error) {
    console.error("Error in /api/admin/users:", error)
    return res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: error.message,
    })
  }
}

 const adminFundUsers = (req, res) => {
  const { userId, amount } = req.body

  if (!userId || !amount) {
    return res.status(400).json({ success: false, message: "Missing required fields" })
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
    return res.json({
      success: true,
      message: "User account funded successfully",
      transaction: newTransaction,
    })
  } else {
    return res.status(500).json({ success: false, message: "Failed to fund user account" })
  }
}

export {adminActvity,adminStats,checkTransactions,getUsers,adminFundUsers}
