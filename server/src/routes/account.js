
// routes/accounts.js
import express from 'express';

import { authenticateToken } from '../middleware/authenticateMiddlware.js';
import { isAdmin } from '../middleware/isAdminMiddleware.js';
import { createAccount,deleteAccount, getAllAccountsForAdmin, getPublicAccountsForUser } from '../controller/accountController.js';

const router = express.Router();


router.post(
  '/create-account',
  authenticateToken,
  isAdmin,
  createAccount
);

router.get('/admin-accounts', authenticateToken, isAdmin, getAllAccountsForAdmin);
router.get('/user-accounts', authenticateToken, getPublicAccountsForUser);
router.delete('/delete-account/:id',authenticateToken,isAdmin,deleteAccount);

export const accountRoute = router;
