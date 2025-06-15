

import fs from 'fs';
import path from 'path';
import { Op } from "sequelize";
import { Account } from '../models/Account.js';



// @desc    Create a new social-media account
// @route   POST /api/accounts
// @access  Admin
const createAccount = async (req, res) => {
    const {
        platform,
        category,
        followers,
        price,
        loginDetails,
        description,
        howToUse,
        status,
    } = req.body;


    if (!platform || !category || !followers || price == null || !loginDetails || !description || !howToUse) {
        return res.status(400).json({
            success: false,
            message: 'platform, category,followers, price, loginDetails, description and howToUse are required.',
        });
    }



    try {
        // 4) Create account document
        const account = await Account.create({
            platform: platform.trim(),
            category,
            followers: parseFloat(followers),
            price: parseFloat(price),
            loginDetails,
            description,
            howToUse,
            status: status || undefined,   // will default in schema
            adminId: req.user.id,
        });

        return res.status(201).json({
            success: true,
            message: 'Account created successfully',
            account,
        });
    } catch (err) {
        console.error('Create account error:', err);
        return res
            .status(500)
            .json({ success: false, message: 'Server error – could not create account' });
    }
};

const updateAccount = async (req, res) => {
    let transaction;
    try {
        const { accountId } = req.params;
        const {
            platform,
            category,
            followers,
            price,
            loginDetails,
            description,
            howToUse,
            status,
        } = req.body;

        // Start transaction
        transaction = await sequelize.transaction();

        // Validate account exists
        const account = await Account.findByPk(accountId, { transaction });
        if (!account) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }



        // Prepare update data
        const updateData = {
            ...(platform && { platform: platform.trim() }),
            ...(category && { category }),
            ...(followers && { followers: parseFloat(followers) }),
            ...(price && { price: parseFloat(price) }),
            ...(loginDetails && { loginDetails }),
            ...(description && { description }),
            ...(howToUse && { howToUse }),
            ...(status && { status }),
        };

        // Perform the update
        await account.update(updateData, { transaction });

        // Delete old image file if it exists and was replaced
        if (oldImagePath && req.file) {
            try {
                await fs.unlink(oldImagePath);
                console.log(`Successfully deleted old image: ${oldImagePath}`);
            } catch (err) {
                console.error(`Error deleting old image (${oldImagePath}):`, err);
                // Don't fail the request if deletion fails
            }
        }

        // Commit transaction
        await transaction.commit();

        // Fetch the updated account with fresh data
        const updatedAccount = await Account.findByPk(accountId);

        return res.status(200).json({
            success: true,
            message: 'Account updated successfully',
            account: updatedAccount
        });

    } catch (error) {
        // Rollback transaction if it was started
        if (transaction) await transaction.rollback();

        console.error('Error updating account:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};



// GET /api/v1/accounts
const getPublicAccountsForUser = async (req, res) => {
    try {
        const { since } = req.query;

        const whereClause = {
            isSold: false // Exclude sold accounts
        };

        if (since) {
            const sinceDate = new Date(since);
            if (!isNaN(sinceDate)) {
                whereClause.updatedAt = { [Op.gt]: sinceDate };
            }
        }

        const accounts = await Account.findAll({
            where: whereClause,
            attributes: { exclude: ['loginDetails'] },
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

        // Fetch all accounts with Sequelize
        const accounts = await Account.findAll({
            // optionally include related admin user info if needed:
            // include: [{ model: User, attributes: ['id', 'name', 'email', 'role'] }]
            raw: true,  // returns plain JS objects instead of Sequelize instances
        });

        return res.json({ success: true, accounts });
    } catch (err) {
        console.error('Admin Get Error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};




//@desc     get account by id
//@route    GET /api/v1/accounts:id
//@role     user get account by id
const getAccountById = (req, res) => {
    const { id } = req.params
    const accounts = readDataFile(ACCOUNTS_FILE)

    // Find account by id
    const account = accounts.find((account) => account.id === id)

    if (!account) {
        return res.status(404).json({ success: false, message: "Account not found" })
    }

    // Remove login details for non-admin users
    if (req.user.role !== "admin") {
        const { loginDetails, ...accountData } = account
        return res.json({ success: true, account: accountData })
    }

    return res.json({ success: true, account })
}

//@desc   create account by admin
//@route POST /api/vi/accounts
//@role  create account




const deleteAccount = async (req, res) => {
    let transaction;
    try {
        const { id } = req.params;

        // Start transaction
        transaction = await sequelize.transaction();

        // Find account including the image path
        const account = await Account.findByPk(id, { transaction });

        if (!account) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        // Store image path before deletion
        const imagePath = account.image
            ? path.join(UPLOAD_DIR, path.basename(account.image))
            : null;

        // Delete the account record
        await account.destroy({ transaction });

        // Delete associated image file if it exists
        if (imagePath) {
            try {
                await fs.unlink(imagePath);
                console.log(`Deleted account image: ${imagePath}`);
            } catch (err) {
                console.error(`Error deleting account image (${imagePath}):`, err);
                // Continue even if image deletion fails
            }
        }

        // Commit transaction
        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (err) {
        // Rollback transaction if it was started
        if (transaction) await transaction.rollback();

        console.error('Delete account error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete account',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};


export { createAccount, getAllAccountsForAdmin, deleteAccount, updateAccount, getPublicAccountsForUser }