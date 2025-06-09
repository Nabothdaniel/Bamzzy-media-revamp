import express from 'express';

const router = express.Router();

import { createAccount } from '../controller/accountController';
import { isAdmin } from '../middleware/isAdminMiddleware';

router.post('/create-account',isAdmin,createAccount);