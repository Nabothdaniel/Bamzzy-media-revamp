
// routes/accounts.js
import express from 'express';
import multer from 'multer';
import { createAccount } from '../controller/accountController.js';

import { authenticateToken } from '../middleware/authenticateMiddlware.js';
import { isAdmin } from '../middleware/isAdminMiddleware.js';

const router = express.Router();

// Multer memory storage
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  '/create-account',
  authenticateToken,
  isAdmin,
  upload.single('image'),   
  createAccount
);

export const accountRoute =  router;
