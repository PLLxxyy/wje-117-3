import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

// ===== 用户管理 =====

// GET /api/admin/users - 获取所有用户
router.get('/users', (req: Request, res: Response) => {
  const users = db.prepare('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// PATCH /api/admin/users/:id/role - 修改用户角色
router.patch('/users/:id/role', (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  const { role } = req.body;

  if (!['user', 'coach', 'admin'].includes(role)) {
    res.status(400).json({ error: '无效角色' });
    return;
  }

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
  res.json({ message: '角色已更新' });
});

// DELETE /api/admin/users/:id - 删除用户
router.delete('/users/:id', (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  if (userId === req.user!.userId) {
    res.status(400).json({ error: '不能删除自己' });
    return;
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  res.json({ message: '用户已删除' });
});

// ===== 模板管理 =====

// GET /api/admin/templates - 获取所有模板
router.get('/templates', (req: Request, res: Response) => {
  const templates = db.prepare(`
    SELECT t.*, u.username as creator_name
    FROM templates t
    JOIN users u ON t.created_by = u.id
    ORDER BY t.created_at DESC
  `).all();
  res.json(templates);
});

// POST /api/admin/templates - 创建模板
router.post('/templates', (req: Request, res: Response) => {
  const { name, level, distance, weeks, description } = req.body;
  const userId = req.user!.userId;

  if (!name || !level || !distance || !weeks) {
    res.status(400).json({ error: '请填写完整信息' });
    return;
  }

  const result = db.prepare(
    'INSERT INTO templates (name, level, distance, weeks, description, created_by) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, level, distance, weeks, description || '', userId);

  res.json({ id: result.lastInsertRowid, message: '模板创建成功' });
});

// PUT /api/admin/templates/:id - 更新模板
router.put('/templates/:id', (req: Request, res: Response) => {
  const templateId = Number(req.params.id);
  const { name, level, distance, weeks, description } = req.body;

  db.prepare(
    'UPDATE templates SET name = ?, level = ?, distance = ?, weeks = ?, description = ? WHERE id = ?'
  ).run(name, level, distance, weeks, description || '', templateId);

  res.json({ message: '模板已更新' });
});

// DELETE /api/admin/templates/:id - 删除模板
router.delete('/templates/:id', (req: Request, res: Response) => {
  const templateId = Number(req.params.id);
  db.prepare('DELETE FROM templates WHERE id = ?').run(templateId);
  res.json({ message: '模板已删除' });
});

// ===== 赛事管理 =====

// GET /api/admin/events - 获取所有赛事
router.get('/events', (req: Request, res: Response) => {
  const events = db.prepare('SELECT * FROM events ORDER BY date ASC').all();
  res.json(events);
});

// POST /api/admin/events - 创建赛事
router.post('/events', (req: Request, res: Response) => {
  const { name, city, date, type } = req.body;

  if (!name || !city || !date || !type) {
    res.status(400).json({ error: '请填写完整信息' });
    return;
  }

  const result = db.prepare(
    'INSERT INTO events (name, city, date, type) VALUES (?, ?, ?, ?)'
  ).run(name, city, date, type);

  res.json({ id: result.lastInsertRowid, message: '赛事创建成功' });
});

// PUT /api/admin/events/:id - 更新赛事
router.put('/events/:id', (req: Request, res: Response) => {
  const eventId = Number(req.params.id);
  const { name, city, date, type } = req.body;

  db.prepare(
    'UPDATE events SET name = ?, city = ?, date = ?, type = ? WHERE id = ?'
  ).run(name, city, date, type, eventId);

  res.json({ message: '赛事已更新' });
});

// DELETE /api/admin/events/:id - 删除赛事
router.delete('/events/:id', (req: Request, res: Response) => {
  const eventId = Number(req.params.id);
  db.prepare('DELETE FROM events WHERE id = ?').run(eventId);
  res.json({ message: '赛事已删除' });
});

// ===== 统计 =====

// GET /api/admin/stats - 后台总览
router.get('/stats', (req: Request, res: Response) => {
  const totalUsers = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'user'").get() as any).c;
  const totalPlans = (db.prepare('SELECT COUNT(*) as c FROM plans').get() as any).c;
  const activePlans = (db.prepare("SELECT COUNT(*) as c FROM plans WHERE status = 'active'").get() as any).c;
  const totalCheckins = (db.prepare('SELECT COUNT(*) as c FROM checkins').get() as any).c;
  const totalCoaches = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'coach'").get() as any).c;

  res.json({ totalUsers, totalPlans, activePlans, totalCheckins, totalCoaches });
});

export default router;
