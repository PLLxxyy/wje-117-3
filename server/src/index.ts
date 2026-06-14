import express from 'express';
import cors from 'cors';
import { initDatabase } from './db';
import db from './db';
import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';
import planRoutes from './routes/plans';
import checkinRoutes from './routes/checkins';
import coachRoutes from './routes/coach';
import adminRoutes from './routes/admin';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();
console.log('数据库初始化完成');

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/plans', authMiddleware, planRoutes);
app.use('/api/checkins', authMiddleware, checkinRoutes);
app.use('/api/coach', authMiddleware, coachRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);

// Public: events listing
app.get('/api/events', (_req, res) => {
  const events = db.prepare('SELECT * FROM events ORDER BY date ASC').all();
  res.json(events);
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`服务运行在 http://localhost:${PORT}`);
});
