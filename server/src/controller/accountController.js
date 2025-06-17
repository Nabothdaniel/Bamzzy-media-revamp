

import { Op } from "sequelize";
import { Account } from '../models/Account.js';
import sequelize from "../utils/database.js";



// @desc    Create a new social-media account
// @route   POST /api/accounts
// @access  Admin
const createAccount = async (req, res) => {
  const { platform, category, price, quantity, accounts, description } = req.body;

  if (!platform || !category || price == null || !Array.isArray(accounts) || accounts.length === 0 || !description) {
    return res.status(400).json({
      success: false,
      message: 'Platform, category, price, description, and a valid accounts array are required.',
    });
  }

  try {
    const accountData = accounts.map((acc) => ({
      platform: platform.trim(),
      category: category.trim(),
      price: parseFloat(price),
      username: acc.username?.trim(),
      password: acc.password?.trim(),
      twoFactor: acc.twoFactor?.trim() || null,
      mail: acc.mail?.trim() || null,
      mailPassword: acc.mailPassword?.trim() || null,
      description: description.trim(), 
      adminId: req.user.id,
    }));

    const created = await Account.bulkCreate(accountData);

    return res.status(201).json({
      success: true,
      message: 'Accounts created successfully',
      accounts: created,
    });
  } catch (err) {
    console.error('Create account error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error – could not create account',
    });
  }
};

// GET /api/v1/accounts
const getPublicAccountsForUser = async (req, res) => {
    try {
        const { since } = req.query;

        const whereClause = {
            isSold: false
        };

        if (since) {
            const sinceDate = new Date(since);
            if (!isNaN(sinceDate)) {
                whereClause.updatedAt = { [Op.gt]: sinceDate };
            }
        }

        const accounts = await Account.findAll({
            where: whereClause,
            attributes: {
                exclude: ['password', 'mailPassword'] // Hide sensitive data
            },
            order: [['updatedAt', 'DESC']],
            raw: true,
        });

        return res.json({ success: true, accounts });
    } catch (err) {
        console.error('User Get Error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/v1/accounts/admin
const getAllAccountsForAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const accounts = await Account.findAll({
            order: [['createdAt', 'DESC']],
            raw: true,
        });

        return res.json({ success: true, accounts });
    } catch (err) {
        console.error('Admin Get Error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};



const deleteAccount = async (req, res) => {
    let transaction;

    try {
        const { id } = req.params;

        transaction = await sequelize.transaction();

        const account = await Account.findByPk(id, { transaction });

        if (!account) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Account not found',
            });
        }

        await account.destroy({ transaction });
        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: 'Account deleted successfully',
        });
    } catch (err) {
        if (transaction) await transaction.rollback();

        console.error('Delete account error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete account',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
    }
};



export { createAccount, getAllAccountsForAdmin, deleteAccount, getPublicAccountsForUser }