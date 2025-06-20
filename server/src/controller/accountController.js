

import { Op } from "sequelize";
import Account from '../models/Account.js';
import sequelize from "../utils/database.js";
import User from "../models/User.js";
import AccountCard from '../models/AccountCard.js'
import { name } from "ejs";



// @desc    Create a new social-media account
// @route   POST /api/accounts
// @access  Admin
const createAccount = async (req, res) => {
    const { platform, category, price, accounts, description } = req.body;

    if (
        !platform ||
        !category ||
        accounts.length === 0
    ) {
        return res.status(400).json({
            success: false,
            message: 'Platform, category, price, and a valid accounts array are required.',
        });
    }

    if (!req.user || !req.user.id) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Missing admin ID',
        });
    }

    const admin = await User.findByPk(req.user.id);
    if (!admin) {
        return res.status(400).json({
            success: false,
            message: 'Admin user does not exist',
        });
    }

    const t = await sequelize.transaction();
    try {
        // 🔍 Match only on platform and category (ignore description)
        const existingCard = await AccountCard.findOne({
            where: {
                platform: platform.trim(),
                category: category.trim(),
            },
            transaction: t,
            lock: t.LOCK.UPDATE,
        });

        let card;

        if (existingCard) {
            // ✅ Update quantity if matched
            existingCard.quantity += accounts.length;

            // Optional: update description and price if needed
            if (!existingCard.description && description) {
                existingCard.description = description.trim();
            }
            if (parseFloat(price) !== existingCard.price) {
                existingCard.price = parseFloat(price);
            }

            await existingCard.save({ transaction: t });
            card = existingCard;
        } else {
            // 🆕 Create new AccountCard
            card = await AccountCard.create({
                platform: platform.trim(),
                category: category.trim(),
                price: parseFloat(price),
                description: description?.trim() || null,
                quantity: accounts.length,
                adminId: req.user.id,
            }, { transaction: t });
        }

        // 📦 Prepare account list
        const accountData = accounts.map(acc => ({
            username: acc.username?.trim(),
            password: acc.password?.trim(),
            twoFactor: acc.twoFactor?.trim() || null,
            mail: acc.mail?.trim() || null,
            mailPassword: acc.mailPassword?.trim() || null,
            isSold: false,
            adminId: req.user.id,
            accountCardId: card.id,
        }));

        const created = await Account.bulkCreate(accountData, { transaction: t });

        await t.commit();

        return res.status(201).json({
            success: true,
            message: existingCard ? 'Accounts added to existing card.' : 'New account card created.',
            card,
            accounts: created,
        });

    } catch (err) {
        await t.rollback();
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
            isAvailable: true 
        };

        if (since) {
            const sinceDate = new Date(since);
            if (!isNaN(sinceDate)) {
                whereClause.updatedAt = { [Op.gt]: sinceDate };
            }
        }

        const accountCards = await AccountCard.findAll({
            where: whereClause,
            attributes: [
                'id',
                'platform',
                'category',
                'description',
                'price',
                'quantity', // assuming quantity is directly stored in the cards table
                'updatedAt'
            ],
            order: [['updatedAt', 'DESC']],
            raw: true
        });

        return res.json({ success: true, accounts: accountCards });
    } catch (err) {
        console.error('User Get Error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/v1/accounts/admin
const getAllAccountsForAdmin = async (req, res) => {
    try {
        const accounts = await Account.findAll({
            attributes: ['id', 'isSold'], // Status = isSold
            include: [
                {
                    model: AccountCard,
                    as: 'card', // Must match the association alias
                    attributes: ['platform', 'price']
                }
            ],
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true
        });

        const formattedAccounts = accounts.map(acc => ({
            id: acc.id,
            platform: acc.card?.platform || 'N/A',
            status: acc.isSold ? 'sold' : 'available',
            price: acc.card?.price || 0
        }));

        return res.json({ success: true, accounts: formattedAccounts });
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