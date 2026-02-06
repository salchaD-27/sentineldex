// npm install express cors dotenv jsonwebtoken date-fns pg cookie-parser ethers
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import api from './routes/api.js';
import dotenv from 'dotenv'
dotenv.config()

const app = express();
// frontend - localhost:3000
// backend - localhost:3001
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// allowing reqs from frontend origin
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true, // if using cookies or auth headers
  allowedHeaders: ['Authorization', 'Content-Type'],
}));
// allowing all origins during development
// app.use(cors());

// Middleware to parse JSON and URL-encoded form data
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// POST /api/auth -> auth.js (user auth login)
// app.use('/api/auth', authjs)
// POST /api/refresh-token -> refresh-token.js
// app.use('/api/refresh-token', refreshtokenjs)


// POST /api/pools
// POST /api/tokens
// POST /api/create-pool
app.use('/api', api)

app.listen(PORT, ()=>{console.log(`backend server running at http://localhost:${PORT}`)})