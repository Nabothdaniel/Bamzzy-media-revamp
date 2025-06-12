import dotenv from 'dotenv';
dotenv.config();

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

        const virtualAccount = response.data.data;

        // Save to your database
        await VirtualAccount.create({
            userId,
            accountNumber: virtualAccount.accountNumber,
            accountName: virtualAccount.accountName,
            bankName: virtualAccount.bankName,
            provider: 'PaymentPoint'
        });

        res.status(201).json({ data: virtualAccount });
    } catch (err) {
        console.error('Error creating virtual account:', err.response?.data || err.message);
        res.status(500).json({ message: 'Failed to create virtual account' });
    }
}

export { createVirtualAccount };
