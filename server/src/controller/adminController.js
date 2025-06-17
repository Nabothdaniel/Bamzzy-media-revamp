

import bcrypt from 'bcrypt';
import User from '../models/User.js';  
import { Account } from '../models/Account.js';
import { generateToken } from '../utils/helperfns.js';
import Transaction from '../models/Transaction.js';
//import sequelize from '../utils/database.js';



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




const adminStats = async (req, res) => {
  try {
    const totalAccounts = await Account.count();
    const accountsSold = await Account.count({ where: { isSold: true} });

    const totalRevenueData = await Transaction.findAll({
      where: { type: 'purchase' },
      attributes: ['price'],
    });

    const totalRevenue = totalRevenueData.reduce((sum, tx) => sum + tx.price, 0);
    const totalUsers = await User.count({ where: { role: 'user' } });

    return res.json({
      success: true,
      stats: {
        totalAccounts,
        accountsSold,
        totalRevenue,
        totalUsers,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};


export {  adminStats, signupAdmin }
