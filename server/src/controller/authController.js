//@desc  registers new users
//@route POST /api/auth/register
//@role  authenticate user

import { User } from '../models/Users.js';
import { generateToken } from '../utils/helperfns.js';
import bcrypt from 'bcrypt';

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Create and save user
    const newUser = await User.create({ name, email:email.toLowerCase(), password, role: 'user' });
    await newUser.save();

    let token = generateToken(newUser);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', //use secure cookies in prod
      sameSite: 'Strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Success response (omit password)
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        token: token,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};



//@desc  user login
//@route POST /api/auth/login
//@role  login user

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });

    console.log(user)
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });

    // Return token and user (exclude password)
    const { password: _, ...userData } = user.toObject();

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userData,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const userProfile = async (req, res) => {
  try {
    // req.user.id is set in authMiddleware
    const user = await User.findById(req.user.id).select('-password'); // exclude password

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

const deleteUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const deletedUser = await User.findByIdAndDelete(userId);

    // If user not found, return 404
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const logoutUser = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

const updatePassword = async (req, res) => {
  const { email, newPassword } = req.body;

  console.log("REQ BODY:", req.body);

  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email and new password are required.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.password = newPassword; 
    await user.save();

    console.log("Password reset for:", user.email);

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};



export { registerUser, loginUser, userProfile, deleteUser, logoutUser, updatePassword };