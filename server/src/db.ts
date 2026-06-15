import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(__dirname, '..', 'data', 'marathon.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'coach', 'admin')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_event TEXT NOT NULL CHECK(target_event IN ('full', 'half')),
      target_time INTEGER NOT NULL,
      current_level TEXT NOT NULL CHECK(current_level IN ('beginner', 'intermediate', 'advanced')),
      training_days INTEGER NOT NULL CHECK(training_days BETWEEN 3 AND 6),
      total_weeks INTEGER NOT NULL DEFAULT 12,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS plan_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      week_number INTEGER NOT NULL,
      day_number INTEGER NOT NULL,
      workout_type TEXT NOT NULL CHECK(workout_type IN ('easy_run', 'interval', 'long_run', 'tempo', 'rest')),
      target_distance_km REAL NOT NULL DEFAULT 0,
      target_pace TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      plan_day_id INTEGER NOT NULL,
      actual_distance_km REAL NOT NULL,
      actual_duration_minutes INTEGER NOT NULL,
      feeling INTEGER NOT NULL CHECK(feeling BETWEEN 1 AND 5),
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (plan_id) REFERENCES plans(id),
      FOREIGN KEY (plan_day_id) REFERENCES plan_days(id)
    );

    CREATE TABLE IF NOT EXISTS coach_students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coach_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (coach_id) REFERENCES users(id),
      FOREIGN KEY (student_id) REFERENCES users(id),
      UNIQUE(coach_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS coach_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coach_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (coach_id) REFERENCES users(id),
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (plan_id) REFERENCES plans(id)
    );

    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      level TEXT NOT NULL,
      distance TEXT NOT NULL,
      weeks INTEGER NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS shoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      brand TEXT NOT NULL DEFAULT '',
      purchase_date TEXT NOT NULL DEFAULT '',
      initial_mileage_km REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'retired')),
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('full', 'half')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Add shoe_id column to checkins if not exists
  const checkinsColumns = db.prepare("PRAGMA table_info(checkins)").all() as any[];
  const hasShoeId = checkinsColumns.some((c: any) => c.name === 'shoe_id');
  if (!hasShoeId) {
    db.exec(`
      ALTER TABLE checkins ADD COLUMN shoe_id INTEGER;
    `);
  }

  // Seed default accounts
  const coachExists = db.prepare('SELECT id FROM users WHERE username = ?').get('coach');
  if (!coachExists) {
    const hash = bcrypt.hashSync('coach123', 10);
    db.prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
      'coach', 'coach@marathon.com', hash, 'coach'
    );
  }

  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
      'admin', 'admin@marathon.com', hash, 'admin'
    );
  }

  // Seed some events
  const eventCount = (db.prepare('SELECT COUNT(*) as c FROM events').get() as any).c;
  if (eventCount === 0) {
    const events = [
      ['北京马拉松', '北京', '2026-10-18', 'full'],
      ['上海马拉松', '上海', '2026-11-16', 'full'],
      ['厦门马拉松', '厦门', '2027-01-03', 'full'],
      ['武汉马拉松', '武汉', '2026-04-12', 'half'],
      ['杭州马拉松', '杭州', '2026-11-02', 'full'],
      ['深圳马拉松', '深圳', '2026-12-07', 'half'],
      ['成都马拉松', '成都', '2026-10-26', 'full'],
      ['广州马拉松', '广州', '2026-12-14', 'half'],
    ];
    const stmt = db.prepare('INSERT INTO events (name, city, date, type) VALUES (?, ?, ?, ?)');
    for (const e of events) {
      stmt.run(...(e as [string, string, string, string]));
    }
  }

  // Seed some templates
  const templateCount = (db.prepare('SELECT COUNT(*) as c FROM templates').get() as any).c;
  if (templateCount === 0) {
    const adminId = (db.prepare('SELECT id FROM users WHERE username = ?').get('admin') as any).id;
    const templates = [
      ['初马完赛计划', 'beginner', 'full', 16, '适合首次全马跑者的16周系统训练计划'],
      ['半马PB突破', 'intermediate', 'half', 12, '帮助有半马经验的跑者刷新个人最好成绩'],
      ['全马Sub330', 'advanced', 'full', 12, '针对高水平跑者的全马3小时30分突破计划'],
      ['入门半马计划', 'beginner', 'half', 10, '零基础到完赛半马的渐进式训练'],
    ];
    const stmt = db.prepare('INSERT INTO templates (name, level, distance, weeks, description, created_by) VALUES (?, ?, ?, ?, ?, ?)');
    for (const t of templates) {
      stmt.run(t[0], t[1], t[2], t[3], t[4], adminId);
    }
  }
}

export default db;
