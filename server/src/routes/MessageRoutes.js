import express from 'express';

const router = express.Router();

import { authenticateToken } from '../middleware/authenticateMiddlware.js';

import { addMessage, getMessages } from '../controller/messagesController.js';

router.post('/messages', authenticateToken, addMessage)
router.get('/messages', authenticateToken, getMessages)

export const messageRoutes = router;