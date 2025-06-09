

import bcrypt from 'bcrypt';
import User from '../models/User.js';  
import { generateToken } from '../utils/helperfns.js';

const signupAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin user
    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
    });

    // Generate token
    const token = generateToken(admin);

    // Set auth cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    // Success response (use id instead of _id for Sequelize)
    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      token,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating admin account',
      error: error.message,
    });
  }
};






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

const adminActvity = (req, res) => {
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


const checkTransactions = (req, res) => {
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

export { adminActvity, adminStats, checkTransactions, signupAdmin, adminFundUsers }
