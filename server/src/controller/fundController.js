import dotenv from 'dotenv';
dotenv.config();


import axios from 'axios';
import crypto from 'crypto';


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
    try {
        const signature = req.headers['paymentpoint-signature'];
        const rawBody = req.rawBody;
        const secret = process.env.PAYMENTPOINT_SECRET;

        if (!secret) {
            return res.status(500).json({ error: 'Server secret not configured' });
        }

        const calculatedSignature = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');

        if (signature !== calculatedSignature) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const {
            transaction_id,
            amount_paid,
            transaction_status,
            receiver,
            timestamp
        } = req.body;

        console.log(transaction_id)
        const receiverAcctNo = receiver?.account_number;
        if (!receiverAcctNo) {
            return res.status(400).json({ error: 'Missing receiver account number' });
        }

        const virtualAcct = await VirtualAccount.findOne({ where: { accountNumber: receiverAcctNo } });
        if (!virtualAcct) {
            return res.status(404).json({ error: 'Virtual account not found' });
        }

        const user = await User.findByPk(virtualAcct.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const now = timestamp ? new Date(timestamp) : new Date();
        const formattedTime = now.toISOString().slice(0, 16).replace('T', ' ');
        const formattedAmount = Number(user.balance).toLocaleString('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2,
        });


        if (transaction_status === 'success') {
            // Fund user account
            user.balance = Number(user.balance) + Number(amount_paid);
            await user.save();

            await Message.create({
                userId: user.id,
                title: `fund ${formattedTime}`,
                content: `Your account was funded with ${amount_paid}.`
            });

            return res.status(200).json({ message: 'Balance and message updated successfully' });
        } else {
            // Log failed transaction
            await Message.create({
                userId: user.id,
                title: `failed fund ${formattedTime}`,
                content: `A funding attempt of ${amount_paid} failed.`
            });

            return res.status(200).json({ message: 'Failed transaction logged.' });
        }
    } catch (error) {
        console.error('Webhook processing error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};


export { createVirtualAccount, getVirtualAccount, handlePaymentPointWebhook };
