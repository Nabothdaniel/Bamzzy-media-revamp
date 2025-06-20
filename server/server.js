import express from "express"
import cors from 'cors';
import dotenv from "dotenv"
import { authRoute } from './src/routes/auth.js'
import { accountRoute } from './src/routes/account.js'
import { adminrouter } from './src/routes/adminRoutes.js'
import sequelize from "./src/utils/database.js";
import { cartRoute } from "./src/routes/cartRoute.js";
import { fundRoutes } from "./src/routes/fundRoute.js";
import { messageRoutes } from "./src/routes/MessageRoutes.js";
import { transactionRouter } from "./src/routes/transactions.js";
import {platformRouter} from './src/routes/platform.js';
import {categoryRouter} from './src/routes/categoryRoute.js'
import './src/models/index.js';

dotenv.config();



const app = express()
const PORT = process.env.PORT || 5000


// Middleware
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: ["http://127.0.0.1:5500","https://bamzzy-media-revamp.vercel.app","https://bamzymedia.com"], // allow Live Server origin
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // ✅ optional but safer
  allowedHeaders: ["Content-Type", "Authorization"], 
}))

//connect db

sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ DB connection failed:', err));




//routes
app.use('/api/v1/auth', authRoute)
app.use('/api/v1/accounts', accountRoute);
app.use('/api/v1/admin', adminrouter);
app.use('/api/v1/cart', cartRoute);
app.use('/api/v1/fund', fundRoutes);
app.use('/api/v1/message', messageRoutes);
app.use('/api/v1/transactions', transactionRouter);
app.use('/api/v1/platforms', platformRouter);
app.use('/api/v1/categories', categoryRouter);

app.use('/',(req,res)=>{
  res.status(200).json({msg:"server runing as expected"})
})



// Start server
  app.listen(PORT,'0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });