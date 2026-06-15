import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

// POST /api/checkins - 训练打卡
router.post('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { plan_id, plan_day_id, actual_distance_km, actual_duration_minutes, feeling, notes, shoe_id } = req.body;

  if (!plan_id || !plan_day_id || actual_distance_km === undefined || !actual_duration_minutes || !feeling) {
    res.status(400).json({ error: '请填写完整的打卡信息' });
    return;
  }

  if (feeling < 1 || feeling > 5) {
    res.status(400).json({ error: '身体感受为1-5分' });
    return;
  }

  if (shoe_id !== undefined && shoe_id !== null) {
    const shoe = db.prepare('SELECT id FROM shoes WHERE id = ? AND user_id = ?').get(shoe_id, userId);
    if (!shoe) {
      res.status(400).json({ error: '跑鞋不存在' });
      return;
    }
  }

  // Check if already checked in for this day
  const existing = db.prepare(
    'SELECT id FROM checkins WHERE user_id = ? AND plan_day_id = ?'
  ).get(userId, plan_day_id);

  if (existing) {
    // Update existing checkin
    db.prepare(
      'UPDATE checkins SET actual_distance_km = ?, actual_duration_minutes = ?, feeling = ?, notes = ?, shoe_id = ? WHERE id = ?'
    ).run(actual_distance_km, actual_duration_minutes, feeling, notes || '', shoe_id || null, (existing as any).id);
    res.json({ id: (existing as any).id, message: '打卡记录已更新' });
    return;
  }

  const result = db.prepare(
    'INSERT INTO checkins (user_id, plan_id, plan_day_id, actual_distance_km, actual_duration_minutes, feeling, notes, shoe_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, plan_id, plan_day_id, actual_distance_km, actual_duration_minutes, feeling, notes || '', shoe_id || null);

  res.json({ id: result.lastInsertRowid, message: '打卡成功' });
});

// GET /api/checkins/plan/:planId - 获取某计划所有打卡
router.get('/plan/:planId', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const planId = Number(req.params.planId);

  const checkins = db.prepare(
    `SELECT c.*, pd.week_number, pd.day_number, pd.workout_type,
            s.id as shoe_id, s.name as shoe_name, s.brand as shoe_brand
     FROM checkins c
     JOIN plan_days pd ON c.plan_day_id = pd.id
     LEFT JOIN shoes s ON c.shoe_id = s.id
     WHERE c.plan_id = ? AND c.user_id = ?
     ORDER BY pd.week_number, pd.day_number`
  ).all(planId, userId);

  res.json(checkins);
});

// GET /api/checkins/stats/:planId - 跑量统计
router.get('/stats/:planId', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const planId = Number(req.params.planId);

  // Weekly distance stats
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
  `).all(planId, userId);

  // Total stats
  const totals = db.prepare(`
    SELECT SUM(actual_distance_km) as total_distance,
           SUM(actual_duration_minutes) as total_duration,
           COUNT(*) as total_checkins,
           AVG(feeling) as avg_feeling
    FROM checkins
    WHERE plan_id = ? AND user_id = ?
  `).get(planId, userId);

  res.json({ weeklyStats, totals });
});

// GET /api/checkins/recent - 最近打卡记录
router.get('/recent', (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const recent = db.prepare(`
    SELECT c.*, pd.week_number, pd.day_number, pd.workout_type, pd.description,
           s.id as shoe_id, s.name as shoe_name, s.brand as shoe_brand
    FROM checkins c
    JOIN plan_days pd ON c.plan_day_id = pd.id
    LEFT JOIN shoes s ON c.shoe_id = s.id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
    LIMIT 10
  `).all(userId);

  res.json(recent);
});

export default router;
