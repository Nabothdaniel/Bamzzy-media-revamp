import express from 'express';

const router = express.Router();

import { authenticateToken } from '../middleware/authenticateMiddlware.js';

import { addMessage, getMessages, markAllMessagesAsRead  } from '../controller/messagesController.js';

router.post('/messages', authenticateToken, addMessage)
router.get('/messages', authenticateToken, getMessages)
router.put('/update-message',authenticateToken,markAllMessagesAsRead );

export const messageRoutes = router;