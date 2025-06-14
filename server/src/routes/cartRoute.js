
// routes/accounts.js
import express from 'express';

import { authenticateToken } from '../middleware/authenticateMiddlware.js';
import { addToCart,getCart,removeFromCart, updateCartQuantity} from '../controller/cartController.js';

const router = express.Router();

router.post('/add',authenticateToken,addToCart);
router.get('/get',authenticateToken,getCart);
router.put('/update',authenticateToken,updateCartQuantity);
router.delete('/delete/:id',authenticateToken,removeFromCart);



export const cartRoute = router;


