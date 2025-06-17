import express from 'express';


const router = express.Router();

import { addPlatform, getPlatforms, deletePlatform } from '../controller/platformController.js';
import { authenticateToken } from '../middleware/authenticateMiddlware.js';
import { isAdmin } from '../middleware/isAdminMiddleware.js';

router.post('/add-platform', authenticateToken, isAdmin, addPlatform);
router.get('/get-platforms', authenticateToken, isAdmin, getPlatforms)
router.delete('/delete-platform/:id', authenticateToken, isAdmin, deletePlatform);

export const platformRouter = router;
//http:localhost:5000/api/v1/platforms/add-platform
//http:localhost:5000/api/v1/platforms/get-platform