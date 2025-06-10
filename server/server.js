import express from "express"
import bodyParser from "body-parser"
import path from "path"
import cors from 'cors';
import { fileURLToPath } from "url"
import dotenv from "dotenv"
import { authRoute } from './src/routes/auth.js'
import { accountRoute } from './src/routes/account.js'
import { adminrouter } from './src/routes/adminRoutes.js'
import sequelize from "./src/utils/database.js";

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
const PORT = process.env.PORT || 5000


// Middleware
app.use(express.json());
app.use(cors({
  origin: "http://127.0.0.1:5500", // allow Live Server origin
  credentials: true
}))

//connect db

sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ DB connection failed:', err));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.json({ limit: "50mb" }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, ".")))



//routes
app.use('/api/v1/auth', authRoute)
app.use('/api/v1/accounts', accountRoute);
app.use('/api/v1/admin', adminrouter);



// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

//Q3si6W86B;z#Op