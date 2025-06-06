import  express from 'express'
import { authenticateToken } from '../middleware/authenticateMiddlware.js';
const router = express.Router();

import  {registerUser,loginUser,deleteUser,logoutUser} from '../controller/authController.js'



router.post('/register',registerUser);
router.post('/login',loginUser);
router.delete('/delete',authenticateToken,deleteUser);
router.post('/logout',authenticateToken,logoutUser);


export const authRoute = router;
