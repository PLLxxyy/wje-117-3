import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db';
import { generateToken, authMiddleware } from '../middleware/auth';
import { User } from '../types';

const router = Router();

// POST /api/auth/register
router.post('/register', (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: '请填写用户名、邮箱和密码' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: '密码至少6位' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    res.status(409).json({ error: '用户名或邮箱已存在' });
    return;
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run(username, email, hash, 'user');

  const token = generateToken({
    userId: result.lastInsertRowid as number,
    username,
    role: 'user',
  });

  res.json({
    token,
    user: { id: result.lastInsertRowid, username, email, role: 'user' },
  });
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '请填写用户名和密码' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  if (!user) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
  });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: '未登录' });
    return;
  }

  const user = db.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?').get(req.user.userId);
  res.json(user);
});

export default router;
