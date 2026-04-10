/**
 * Water Tracking Routes
 * GET    /api/water         — Get today's water intake
 * POST   /api/water/add     — Add a glass
 * POST   /api/water/remove  — Remove a glass
 * GET    /api/water/weekly  — Weekly water data
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db.cjs');

// GET /api/water
router.get('/', (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const result = db.prepare(`
      SELECT COALESCE(SUM(glasses), 0) as total
      FROM water_logs WHERE user_id = ? AND date = ?
    `).get(userId, date);

    const user = db.prepare('SELECT water_goal FROM users WHERE id = ?').get(userId);

    res.json({
      success: true,
      data: { current: result.total, goal: user?.water_goal || 8, date },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/water/add
router.post('/add', (req, res) => {
  try {
    const userId = req.body.userId || 'default-user';
    const date = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO water_logs (id, user_id, glasses, date)
      VALUES (?, ?, 1, ?)
    `).run(uuidv4(), userId, date);

    const result = db.prepare(`
      SELECT COALESCE(SUM(glasses), 0) as total
      FROM water_logs WHERE user_id = ? AND date = ?
    `).get(userId, date);

    const user = db.prepare('SELECT water_goal FROM users WHERE id = ?').get(userId);

    // Check hydration achievement
    if (result.total >= (user?.water_goal || 8)) {
      const daysHit = db.prepare(`
        SELECT COUNT(DISTINCT date) as c FROM (
          SELECT date, SUM(glasses) as total
          FROM water_logs WHERE user_id = ?
          GROUP BY date
          HAVING total >= ?
        )
      `).get(userId, user?.water_goal || 8).c;

      if (daysHit >= 5) {
        try {
          db.prepare('INSERT OR IGNORE INTO achievements (id, user_id, achievement_key) VALUES (?, ?, ?)')
            .run(uuidv4(), userId, 'hydration_hero');
        } catch (e) {}
      }
    }

    res.json({
      success: true,
      data: { current: result.total, goal: user?.water_goal || 8 },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/water/remove
router.post('/remove', (req, res) => {
  try {
    const userId = req.body.userId || 'default-user';
    const date = new Date().toISOString().split('T')[0];

    // Delete most recent water log for today
    const latest = db.prepare(`
      SELECT id FROM water_logs
      WHERE user_id = ? AND date = ?
      ORDER BY created_at DESC LIMIT 1
    `).get(userId, date);

    if (latest) {
      db.prepare('DELETE FROM water_logs WHERE id = ?').run(latest.id);
    }

    const result = db.prepare(`
      SELECT COALESCE(SUM(glasses), 0) as total
      FROM water_logs WHERE user_id = ? AND date = ?
    `).get(userId, date);

    const user = db.prepare('SELECT water_goal FROM users WHERE id = ?').get(userId);

    res.json({
      success: true,
      data: { current: result.total, goal: user?.water_goal || 8 },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/water/weekly
router.get('/weekly', (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      const result = db.prepare(`
        SELECT COALESCE(SUM(glasses), 0) as total
        FROM water_logs WHERE user_id = ? AND date = ?
      `).get(userId, dateStr);

      days.push({
        day: dayNames[d.getDay()],
        date: dateStr,
        glasses: result.total,
      });
    }

    res.json({ success: true, data: days });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
