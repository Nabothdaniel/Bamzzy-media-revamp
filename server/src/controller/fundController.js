import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

import { VirtualAccount } from '../models/VirtualAccounts.js';
import User from '../models/User.js';
import Message from '../models/Message.js';

const createVirtualAccount = async (req, res) => {
    const { name, email, phoneNumber } = req.body;
    const userId = req.user.id;

    try {
        const response = await axios.post('https://api.paymentpoint.co/api/v1/createVirtualAccount', {
            name,
            email,
            phoneNumber,
            bankCode: ['20946'],
            businessId: process.env.BUSINESS_ID
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PAYMENTPOINT_SECRET}`,
                'api-key': process.env.PAYMENTPOINT_API_KEY
            }
        });

        const virtualAccount = response.data.bankAccounts?.[0]; // safely get first account

        if (!virtualAccount) {
            throw new Error("No virtual account returned from PaymentPoint");
        }

        // Save to your database
        await VirtualAccount.create({
            userId,
            accountNumber: virtualAccount.accountNumber,
            accountName: virtualAccount.accountName,
            bankName: virtualAccount.bankName,
            bankCode: virtualAccount.bankCode,
            provider: 'PaymentPoint'
        });

        res.status(201).json({ data: virtualAccount });
    } catch (err) {
        console.error('Error creating virtual account:', err.response?.data || err.message);
        res.status(500).json({ message: 'Failed to create virtual account' });
    }
}

const getVirtualAccount = async (req, res) => {
    const userId = req.user.id;

    try {
        const virtualAccount = await VirtualAccount.findOne({
            where: { userId },
            attributes: ['accountNumber', 'accountName', 'bankName', 'bankCode', 'provider'],
        });

        if (!virtualAccount) {
            return res.status(404).json({ message: 'No virtual account found for this user' });
        }

        res.status(200).json({ data: virtualAccount });
    } catch (err) {
        console.error('Error fetching virtual account:', err);
        res.status(500).json({ message: 'Failed to fetch virtual account' });
    }
};

const handlePaymentPointWebhook = async (req, res) => {
    const signature = req.headers['paymentpoint-signature'];
    const rawBody = JSON.stringify(req.body);
    const secret = process.env.WEBHOOK_SECRET;

    const calculatedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

    if (signature !== calculatedSignature) {
        return res.status(400).json({ error: 'Invalid signature' });
    }

    const { transaction_id, amount_paid, transaction_status, metadata } = req.body;

    if (transaction_status !== 'successful') {
        return res.status(200).json({ message: 'Transaction not successful, ignored.' });
    }

    try {
        const userId = metadata?.userId;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Update user balance
        user.balance += parseFloat(amount_paid);
        await user.save();

        // Create message
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 16).replace('T', ' '); // e.g. 2025-06-09 11:20
        const formattedAmount = Number(amount_paid).toLocaleString('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        });

        await Message.create({
            userId: user.id,
            title: `fund ${timestamp}`,
            content: `Your account was funded with ${formattedAmount}.`
        });

        return res.status(200).json({ message: 'Balance and message updated successfully' });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};

export { createVirtualAccount, getVirtualAccount, handlePaymentPointWebhook };
