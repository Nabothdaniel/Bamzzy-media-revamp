import express from 'express'
import { authenticateToken } from '../middleware/authenticateMiddlware.js';
const router = express.Router();

import { registerUser, loginUser, userProfile, deleteUser, logoutUser,updatePassword } from '../controller/authController.js'



router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', authenticateToken, userProfile);
router.delete('/delete', authenticateToken, deleteUser);
router.post('/logout', authenticateToken, logoutUser);
router.post('/reset-password', authenticateToken, updatePassword);


export const authRoute = router;
