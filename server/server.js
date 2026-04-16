import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import candidateRoutes from './routes/candidates.js';
import questionRoutes from './routes/questions.js';

const app = express();
const PORT = process.env.PORT || 5000;

/* ─── Middleware ─────────────────────────────────────── */
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));   // Large limit for audio Base64
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/questions', questionRoutes);

/* ─── Health Check ───────────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ─── Connect to MongoDB & Start ─────────────────────── */
async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB Atlas');
    
    app.listen(PORT, () => {
      console.log(`✓ Innovision API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

start();
