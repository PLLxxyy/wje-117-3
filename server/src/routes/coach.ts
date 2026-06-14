import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

// GET /api/coach/students - 教练获取学员列表
router.get('/students', (req: Request, res: Response) => {
  const coachId = req.user!.userId;

  const students = db.prepare(`
    SELECT u.id, u.username, u.email, u.created_at, cs.created_at as linked_at
    FROM coach_students cs
    JOIN users u ON cs.student_id = u.id
    WHERE cs.coach_id = ?
    ORDER BY cs.created_at DESC
  `).all(coachId);

  res.json(students);
});

// POST /api/coach/students - 教练添加学员
router.post('/students', (req: Request, res: Response) => {
  const coachId = req.user!.userId;
  const { student_username } = req.body;

  if (!student_username) {
    res.status(400).json({ error: '请输入学员用户名' });
    return;
  }

  const student = db.prepare("SELECT id, role FROM users WHERE username = ?").get(student_username) as any;
  if (!student) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }

  if (student.role !== 'user') {
    res.status(400).json({ error: '只能添加普通用户作为学员' });
    return;
  }

  const existing = db.prepare('SELECT id FROM coach_students WHERE coach_id = ? AND student_id = ?').get(coachId, student.id);
  if (existing) {
    res.status(409).json({ error: '该学员已在列表中' });
    return;
  }

  db.prepare('INSERT INTO coach_students (coach_id, student_id) VALUES (?, ?)').run(coachId, student.id);
  res.json({ message: '学员添加成功' });
});

// DELETE /api/coach/students/:studentId - 移除学员
router.delete('/students/:studentId', (req: Request, res: Response) => {
  const coachId = req.user!.userId;
  const studentId = Number(req.params.studentId);

  db.prepare('DELETE FROM coach_students WHERE coach_id = ? AND student_id = ?').run(coachId, studentId);
  res.json({ message: '学员已移除' });
});

// GET /api/coach/students/:studentId/plan - 查看学员训练计划
router.get('/students/:studentId/plan', (req: Request, res: Response) => {
  const studentId = Number(req.params.studentId);

  const plan = db.prepare("SELECT * FROM plans WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1").get(studentId);
  if (!plan) {
    res.json(null);
    return;
  }

  const days = db.prepare('SELECT * FROM plan_days WHERE plan_id = ? ORDER BY week_number, day_number').all((plan as any).id);
  const checkins = db.prepare('SELECT * FROM checkins WHERE plan_id = ? AND user_id = ?').all((plan as any).id, studentId);

  res.json({ ...(plan as any), days, checkins });
});

// GET /api/coach/students/:studentId/stats - 查看学员统计数据
router.get('/students/:studentId/stats', (req: Request, res: Response) => {
  const studentId = Number(req.params.studentId);

  const plan = db.prepare("SELECT id FROM plans WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1").get(studentId) as any;
  if (!plan) {
    res.json({ weeklyStats: [], totals: null });
    return;
  }

  const weeklyStats = db.prepare(`
    SELECT pd.week_number,
           SUM(c.actual_distance_km) as total_distance,
           SUM(c.actual_duration_minutes) as total_duration,
           COUNT(c.id) as checkin_count,
           AVG(c.feeling) as avg_feeling
    FROM checkins c
    JOIN plan_days pd ON c.plan_day_id = pd.id
    WHERE c.plan_id = ? AND c.user_id = ?
    GROUP BY pd.week_number
    ORDER BY pd.week_number
  `).all(plan.id, studentId);

  const totals = db.prepare(`
    SELECT SUM(actual_distance_km) as total_distance,
           SUM(actual_duration_minutes) as total_duration,
           COUNT(*) as total_checkins,
           AVG(feeling) as avg_feeling
    FROM checkins
    WHERE plan_id = ? AND user_id = ?
  `).get(plan.id, studentId);

  res.json({ weeklyStats, totals });
});

// POST /api/coach/notes - 教练留言
router.post('/notes', (req: Request, res: Response) => {
  const coachId = req.user!.userId;
  const { student_id, plan_id, content } = req.body;

  if (!student_id || !plan_id || !content) {
    res.status(400).json({ error: '请填写完整信息' });
    return;
  }

  const result = db.prepare(
    'INSERT INTO coach_notes (coach_id, student_id, plan_id, content) VALUES (?, ?, ?, ?)'
  ).run(coachId, student_id, plan_id, content);

  res.json({ id: result.lastInsertRowid, message: '留言已发送' });
});

// GET /api/coach/notes/:studentId - 获取对某学员的留言
router.get('/notes/:studentId', (req: Request, res: Response) => {
  const coachId = req.user!.userId;
  const studentId = Number(req.params.studentId);

  const notes = db.prepare(`
    SELECT cn.*, u.username as coach_name
    FROM coach_notes cn
    JOIN users u ON cn.coach_id = u.id
    WHERE cn.coach_id = ? AND cn.student_id = ?
    ORDER BY cn.created_at DESC
  `).all(coachId, studentId);

  res.json(notes);
});

// GET /api/coach/received-notes - 学员获取教练给自己的留言
router.get('/received-notes', (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const notes = db.prepare(`
    SELECT cn.*, u.username as coach_name
    FROM coach_notes cn
    JOIN users u ON cn.coach_id = u.id
    WHERE cn.student_id = ?
    ORDER BY cn.created_at DESC
  `).all(userId);

  res.json(notes);
});

export default router;
