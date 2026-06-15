import { Router, Request, Response } from 'express';
import db from '../db';
import { Shoe } from '../types';

const router = Router();

// GET /api/shoes - 获取用户所有跑鞋
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const shoes = db.prepare(`
    SELECT s.*,
           COALESCE(SUM(c.actual_distance_km), 0) as total_distance
    FROM shoes s
    LEFT JOIN checkins c ON s.id = c.shoe_id AND c.user_id = s.user_id
    WHERE s.user_id = ?
    GROUP BY s.id
    ORDER BY s.status = 'active' DESC, s.created_at DESC
  `).all(userId) as (Shoe & { total_distance: number })[];

  const result = shoes.map(shoe => ({
    ...shoe,
    total_distance: Number((shoe.initial_mileage_km + shoe.total_distance).toFixed(2)),
  }));

  res.json(result);
});

// GET /api/shoes/:id - 获取单只跑鞋详情
router.get('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);

  const shoe = db.prepare(`
    SELECT s.*,
           COALESCE(SUM(c.actual_distance_km), 0) as total_distance
    FROM shoes s
    LEFT JOIN checkins c ON s.id = c.shoe_id AND c.user_id = s.user_id
    WHERE s.id = ? AND s.user_id = ?
    GROUP BY s.id
  `).get(id, userId) as (Shoe & { total_distance: number }) | undefined;

  if (!shoe) {
    res.status(404).json({ error: '跑鞋不存在' });
    return;
  }

  const result = {
    ...shoe,
    total_distance: Number((shoe.initial_mileage_km + shoe.total_distance).toFixed(2)),
  };

  res.json(result);
});

// POST /api/shoes - 新增跑鞋
router.post('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { name, brand, purchase_date, initial_mileage_km, notes } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: '请输入跑鞋名称' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO shoes (user_id, name, brand, purchase_date, initial_mileage_km, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    name.trim(),
    brand || '',
    purchase_date || '',
    Number(initial_mileage_km) || 0,
    notes || ''
  );

  const shoe = db.prepare('SELECT * FROM shoes WHERE id = ?').get(result.lastInsertRowid) as Shoe;
  res.status(201).json({ ...shoe, total_distance: shoe.initial_mileage_km });
});

// PUT /api/shoes/:id - 更新跑鞋信息
router.put('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);
  const { name, brand, purchase_date, initial_mileage_km, status, notes } = req.body;

  const existing = db.prepare('SELECT * FROM shoes WHERE id = ? AND user_id = ?').get(id, userId);
  if (!existing) {
    res.status(404).json({ error: '跑鞋不存在' });
    return;
  }

  if (status && !['active', 'retired'].includes(status)) {
    res.status(400).json({ error: '状态无效' });
    return;
  }

  db.prepare(`
    UPDATE shoes
    SET name = ?, brand = ?, purchase_date = ?, initial_mileage_km = ?, status = ?, notes = ?
    WHERE id = ? AND user_id = ?
  `).run(
    name || (existing as Shoe).name,
    brand !== undefined ? brand : (existing as Shoe).brand,
    purchase_date !== undefined ? purchase_date : (existing as Shoe).purchase_date,
    initial_mileage_km !== undefined ? Number(initial_mileage_km) : (existing as Shoe).initial_mileage_km,
    status || (existing as Shoe).status,
    notes !== undefined ? notes : (existing as Shoe).notes,
    id,
    userId
  );

  const updated = db.prepare(`
    SELECT s.*,
           COALESCE(SUM(c.actual_distance_km), 0) as total_distance
    FROM shoes s
    LEFT JOIN checkins c ON s.id = c.shoe_id AND c.user_id = s.user_id
    WHERE s.id = ? AND s.user_id = ?
    GROUP BY s.id
  `).get(id, userId) as Shoe & { total_distance: number };

  const result = {
    ...updated,
    total_distance: Number((updated.initial_mileage_km + updated.total_distance).toFixed(2)),
  };

  res.json(result);
});

// PATCH /api/shoes/:id/status - 更新跑鞋状态
router.patch('/:id/status', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);
  const { status } = req.body;

  if (!status || !['active', 'retired'].includes(status)) {
    res.status(400).json({ error: '状态无效' });
    return;
  }

  const existing = db.prepare('SELECT * FROM shoes WHERE id = ? AND user_id = ?').get(id, userId);
  if (!existing) {
    res.status(404).json({ error: '跑鞋不存在' });
    return;
  }

  db.prepare('UPDATE shoes SET status = ? WHERE id = ? AND user_id = ?').run(status, id, userId);
  res.json({ message: '状态已更新' });
});

// DELETE /api/shoes/:id - 删除跑鞋
router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);

  const existing = db.prepare('SELECT * FROM shoes WHERE id = ? AND user_id = ?').get(id, userId);
  if (!existing) {
    res.status(404).json({ error: '跑鞋不存在' });
    return;
  }

  db.prepare('UPDATE checkins SET shoe_id = NULL WHERE shoe_id = ? AND user_id = ?').run(id, userId);
  db.prepare('DELETE FROM shoes WHERE id = ? AND user_id = ?').run(id, userId);

  res.json({ message: '跑鞋已删除' });
});

export default router;
