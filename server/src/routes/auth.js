import express from 'express'
const router = express.Router();


import { authenticateToken } from '../middleware/authenticateMiddlware.js';
import { registerUser, loginUser, userProfile, deleteUser, logoutUser,updatePassword,updateBalance } from '../controller/authController.js'



router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', authenticateToken, userProfile);
router.delete('/delete', authenticateToken, deleteUser);
router.post('/logout', authenticateToken, logoutUser);
router.post('/reset-password', authenticateToken, updatePassword);
router.put('/update-account', authenticateToken, updateBalance);


export const authRoute = router;
