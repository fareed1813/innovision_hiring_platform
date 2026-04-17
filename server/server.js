import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import candidateRoutes from './routes/candidates.js';
import questionRoutes from './routes/questions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

/* ─── Middleware ─────────────────────────────────────── */
app.use(cors({
  origin: '*', // Allow all origins in production for simplicity, or refine based on your Render URL
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));   // Large limit for audio Base64
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/* ─── API Routes ─────────────────────────────────────── */
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/questions', questionRoutes);

/* ─── Health Check ───────────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ─── Serve Static Files ─────────────────────────────── */
// Serve legacy assessment tool at /assessment
app.use('/assessment', express.static(path.join(__dirname, '../innovision-hiring')));

// Serve modern React frontend
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// SPA Catch-all: Send index.html for any non-API routes (React Router handles the rest)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

/* ─── Connect to MongoDB & Start ─────────────────────── */
async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB Atlas');
    
    app.listen(PORT, () => {
      console.log(`✓ Innovision API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

start();
