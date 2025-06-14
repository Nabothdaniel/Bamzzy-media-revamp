import express from "express";

const router = express.Router();

import { createVirtualAccount, getVirtualAccount, handlePaymentPointWebhook } from "../controller/fundController.js";
import { authenticateToken } from "../middleware/authenticateMiddlware.js";


router.post('/create-virtual-account', authenticateToken, createVirtualAccount);
router.get('/get-virtual-account', authenticateToken, getVirtualAccount);
router.post('/webhook',handlePaymentPointWebhook);


export const fundRoutes = router;