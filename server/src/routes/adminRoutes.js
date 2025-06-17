import express from 'express';

const router = express.Router();

import { signupAdmin,adminStats } from '../controller/adminController.js';
import { authenticateToken } from '../middleware/authenticateMiddlware.js';
import { isAdmin } from '../middleware/isAdminMiddleware.js';

router.post('/create-admin',authenticateToken,signupAdmin);
router.get('/get-admin-stats',authenticateToken,isAdmin,adminStats)


export const adminrouter = router;