import express from "express";

const router = express.Router();

import { createVirtualAccount,getVirtualAccount } from "../controller/fundController.js";
import { authenticateToken } from "../middleware/authenticateMiddlware.js";


router.post('/create-virtual-account',authenticateToken,createVirtualAccount);
router.get('/get-virtual-account',authenticateToken,getVirtualAccount);


export  const fundRoutes = router;