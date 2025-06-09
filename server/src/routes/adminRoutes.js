import express from 'express';

const router = express.Router();

import { signupAdmin } from '../controller/adminController.js';

router.post('/create-admin',signupAdmin);


export const adminrouter = router;