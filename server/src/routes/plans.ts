import { Router, Request, Response } from 'express';
import db from '../db';
import { generatePlan } from '../services/planGenerator';
import { PlanInput } from '../types';

const router = Router();

// POST /api/plans - 创建训练计划
router.post('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input: PlanInput = req.body;

  if (!input.target_event || !input.target_time || !input.current_level || !input.training_days) {
    res.status(400).json({ error: '请填写完整信息' });
    return;
  }

  // Deactivate previous active plans
  db.prepare("UPDATE plans SET status = 'completed' WHERE user_id = ? AND status = 'active'").run(userId);

  // Create plan
  const result = db.prepare(
    'INSERT INTO plans (user_id, target_event, target_time, current_level, training_days, total_weeks) VALUES (?, ?, ?, ?, ?, 12)'
  ).run(userId, input.target_event, input.target_time, input.current_level, input.training_days);

  const planId = result.lastInsertRowid as number;

  // Generate and insert plan days
  const planDays = generatePlan(input);
  const stmt = db.prepare(
    'INSERT INTO plan_days (plan_id, week_number, day_number, workout_type, target_distance_km, target_pace, description) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const insertMany = db.transaction((days: typeof planDays) => {
    for (const day of days) {
      stmt.run(planId, day.week_number, day.day_number, day.workout_type, day.target_distance_km, day.target_pace, day.description);
    }
  });
  insertMany(planDays);

  res.json({ id: planId, message: '训练计划已生成' });
});

// GET /api/plans/active - 获取当前活跃计划
router.get('/active', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const plan = db.prepare("SELECT * FROM plans WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1").get(userId);

  if (!plan) {
    res.json(null);
    return;
  }

  const days = db.prepare('SELECT * FROM plan_days WHERE plan_id = ? ORDER BY week_number, day_number').all((plan as any).id);

  // Get checkins for this plan
  const checkins = db.prepare('SELECT * FROM checkins WHERE plan_id = ? AND user_id = ?').all((plan as any).id, userId);

  res.json({ ...(plan as any), days, checkins });
});

// GET /api/plans - 获取用户所有计划
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const plans = db.prepare('SELECT * FROM plans WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  res.json(plans);
});

// GET /api/plans/:id - 获取指定计划详情
router.get('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const planId = Number(req.params.id);

  const plan = db.prepare('SELECT * FROM plans WHERE id = ? AND user_id = ?').get(planId, userId);
  if (!plan) {
    res.status(404).json({ error: '计划不存在' });
    return;
  }

  const days = db.prepare('SELECT * FROM plan_days WHERE plan_id = ? ORDER BY week_number, day_number').all(planId);
  const checkins = db.prepare('SELECT * FROM checkins WHERE plan_id = ? AND user_id = ?').all(planId, userId);

  res.json({ ...(plan as any), days, checkins });
});

// PATCH /api/plans/:id/complete - 完成计划
router.patch('/:id/complete', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const planId = Number(req.params.id);

  const plan = db.prepare('SELECT * FROM plans WHERE id = ? AND user_id = ?').get(planId, userId);
  if (!plan) {
    res.status(404).json({ error: '计划不存在' });
    return;
  }

  db.prepare("UPDATE plans SET status = 'completed' WHERE id = ?").run(planId);
  res.json({ message: '计划已标记完成' });
});

export default router;
