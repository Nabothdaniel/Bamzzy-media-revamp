

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

import { Account } from '../models/Accounts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

//@desc     get all accounts by admin
//@route    GET /api/v1/accounts
//@role     get all accounts
const getAccounts = async (req, res) => {
    const accounts = readDataFile(ACCOUNTS_FILE)

    // Remove login details for non-admin users
    let filteredAccounts = accounts
    if (req.user.role !== "admin") {
        filteredAccounts = accounts.map((account) => {
            const { loginDetails, ...accountData } = account
            return accountData
        })
    }

    return res.json({ success: true, accounts: filteredAccounts })
}


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



// @desc    Create a new social-media account
// @route   POST /api/accounts
// @access  Admin
const createAccount = async (req, res) => {
    const {
        platform,
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
    if (!platform || price == null || !loginDetails || !description || !howToUse) {
        return res.status(400).json({
            success: false,
            message: 'platform, price, loginDetails, description and howToUse are required.',
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
        const imageUrl = `/uploads/${filename}`;

        // 4) Create account document
        const account = await Account.create({
            platform: platform.trim(),
            image: imageUrl,
            price: parseFloat(price),
            loginDetails,
            description,
            howToUse,
            status: status || undefined,   // will default in schema
            admin: req.user._id,
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

const deleteAccount = (req, res) => {
    const { id } = req.params
    const accounts = readDataFile(ACCOUNTS_FILE)

    // Find account index
    const accountIndex = accounts.findIndex((account) => account.id === id)

    if (accountIndex === -1) {
        return res.status(404).json({ success: false, message: "Account not found" })
    }

    // Remove account
    accounts.splice(accountIndex, 1)

    if (writeDataFile(ACCOUNTS_FILE, accounts)) {
        return res.json({ success: true, message: "Account deleted successfully" })
    } else {
        return res.status(500).json({ success: false, message: "Failed to delete account" })
    }
}


export { createAccount }