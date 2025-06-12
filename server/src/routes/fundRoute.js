import express from "express";

const router = express.Router();

import { createVirtualAccount } from "../controller/fundController.js";
import { authenticateToken } from "../middleware/authenticateMiddlware.js";


router.post('/create-virtual-account',authenticateToken,createVirtualAccount);


export  const fundRoutes = router;