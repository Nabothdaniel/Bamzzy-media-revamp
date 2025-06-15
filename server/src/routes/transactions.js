import express from 'express';

import { createTransactions,getPurchasedAccounts,getAllTransactions } from '../controller/transactionController.js';
import { authenticateToken } from '../middleware/authenticateMiddlware.js';

const router = express.Router();

router.post('/create-transaction',authenticateToken,createTransactions);
router.get('/get-transaction',authenticateToken,getPurchasedAccounts);
router.get('/get-all-transactions',authenticateToken,getAllTransactions);

export const transactionRouter = router;


