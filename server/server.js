import express from "express"
import bodyParser from "body-parser"
import path from "path"
import cors from 'cors';
import { fileURLToPath } from "url"
import dotenv from "dotenv"
import { authRoute } from './src/routes/auth.js'
import connectDb from "./src/utils/db.js"

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
const PORT = process.env.PORT || 7860

//connect to database

connectDb();

// Middleware
app.use(express.json())
app.use(cors({
  origin: "http://127.0.0.1:5500", // allow Live Server origin
  credentials: true
}))
app.use(bodyParser.json({ limit: "50mb" }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, ".")))



//routes
app.use('/api/v1/auth', authRoute)



// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
