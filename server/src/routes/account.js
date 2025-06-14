
// routes/accounts.js
import express from 'express';
import multer from 'multer';

import { authenticateToken } from '../middleware/authenticateMiddlware.js';
import { isAdmin } from '../middleware/isAdminMiddleware.js';
import { createAccount, getAllAccountsForAdmin, getPublicAccountsForUser } from '../controller/accountController.js';

const router = express.Router();


router.post(
  '/create-account',
  authenticateToken,
  isAdmin,
  createAccount
);

router.get('/admin-accounts', authenticateToken, isAdmin, getAllAccountsForAdmin);
router.get('/user-accounts', authenticateToken, getPublicAccountsForUser);

export const accountRoute = router;
