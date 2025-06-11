

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { Op } from "sequelize";
import { Account } from '../models/Account.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

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

    // 1) Validate fields + file
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Image file is required.' });
    }
    if (!platform || !category || !followers || price == null || !loginDetails || !description || !howToUse) {
        return res.status(400).json({
            success: false,
            message: 'platform, category,followers, price, loginDetails, description and howToUse are required.',
        });
    }

    if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ success: false, message: 'Only image files are allowed.' });
    }

    try {
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${req.file.originalname.replace(/\s+/g, '_')}`;

        const filepath = path.join(UPLOAD_DIR, filename);

        await sharp(req.file.buffer)
            .resize({ width: 800 })       // optional: max width
            .jpeg({ quality: 80 })        // compress to 80% quality
            .toFile(filepath);

        // 3) Build URL path (served via express.static)
        const imageUrl = `src/uploads/${filename}`;

        // 4) Create account document
        const account = await Account.create({
            platform: platform.trim(),
            image: imageUrl,
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

        // Store old image path if exists
        const oldImagePath = account.image
            ? path.join(UPLOAD_DIR, path.basename(account.image))
            : null;

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

        // Handle image upload if present
        if (req.file) {
            if (!req.file.mimetype.startsWith('image/')) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Only image files are allowed.'
                });
            }

            // Generate filename and path
            const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${req.file.originalname.replace(/\s+/g, '_')}`;
            const filepath = path.join(UPLOAD_DIR, filename);

            // Process image with sharp
            await sharp(req.file.buffer)
                .resize({ width: 800 })
                .jpeg({ quality: 80 })
                .toFile(filepath);

            // Add new image to update data
            updateData.image = `src/uploads/${filename}`;
        }

        // Validate at least one field is being updated
        if (Object.keys(updateData).length === 0 && !req.file) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'No valid fields provided for update'
            });
        }

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
        const { since } = req.query; // optional query param like ?since=timestamp

        const whereClause = since
            ? {
                updatedAt: {
                    [Op.gt]: new Date(since),
                },
            }
            : {};

        const accounts = await Account.findAll({
            where: whereClause,
            attributes: {
                exclude: ['loginDetails'], // Exclude sensitive info
            },
            order: [['updatedAt', 'DESC']],
            raw: true,
        });

        return res.json({ success: true, accounts });
    } catch (err) {
        console.error('User Get Error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

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


export { createAccount, getAllAccountsForAdmin,deleteAccount, updateAccount, getPublicAccountsForUser }