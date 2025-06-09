import express from 'express';

const router = express.Router();

//import { isAdmin } from '../middleware/isAdminMiddleware';
import { signupAdmin } from '../controller/adminController.js';

router.post('/create-admin',signupAdmin);


export const adminrouter = router;