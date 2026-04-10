/**
 * Food Log Routes — Full CRUD
 * GET    /api/food-log          — Get logs for a date
 * GET    /api/food-log/stats    — Get daily nutrition stats
 * GET    /api/food-log/weekly   — Get weekly chart data
 * POST   /api/food-log          — Add a food entry
 * PUT    /api/food-log/:id      — Update a food entry
 * DELETE /api/food-log/:id      — Delete a food entry
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db.cjs');

// ============================================
// GET /api/food-log — Get logs for a date
// ============================================
router.get('/', (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const mealType = req.query.mealType || null;

    let query = 'SELECT * FROM food_logs WHERE user_id = ? AND date = ?';
    const params = [userId, date];

    if (mealType && mealType !== 'All') {
      query += ' AND meal_type = ?';
      params.push(mealType);
    }

    query += ' ORDER BY created_at ASC';

    const logs = db.prepare(query).all(...params);
    res.json({ success: true, data: logs });
  } catch (err) {
    console.error('Get food log error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// GET /api/food-log/stats — Get daily nutrition totals
// ============================================
router.get('/stats', (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const stats = db.prepare(`
      SELECT
        COALESCE(SUM(calories), 0) as totalCalories,
        COALESCE(SUM(protein), 0) as totalProtein,
        COALESCE(SUM(carbs), 0) as totalCarbs,
        COALESCE(SUM(fat), 0) as totalFat,
        COALESCE(SUM(fiber), 0) as totalFiber,
        COALESCE(SUM(sugar), 0) as totalSugar,
        COUNT(*) as mealCount
      FROM food_logs
      WHERE user_id = ? AND date = ?
    `).get(userId, date);

    // Get user goals
    const user = db.prepare(
      'SELECT calorie_goal, protein_goal, carbs_goal, fat_goal, fiber_goal FROM users WHERE id = ?'
    ).get(userId);

    // Get water intake
    const water = db.prepare(`
      SELECT COALESCE(SUM(glasses), 0) as total
      FROM water_logs WHERE user_id = ? AND date = ?
    `).get(userId, date);

    const waterGoal = db.prepare('SELECT water_goal FROM users WHERE id = ?').get(userId);

    res.json({
      success: true,
      data: {
        calories: { current: Math.round(stats.totalCalories), goal: user?.calorie_goal || 2200 },
        protein: { current: Math.round(stats.totalProtein), goal: user?.protein_goal || 140 },
        carbs: { current: Math.round(stats.totalCarbs), goal: user?.carbs_goal || 250 },
        fat: { current: Math.round(stats.totalFat), goal: user?.fat_goal || 70 },
        fiber: { current: Math.round(stats.totalFiber), goal: user?.fiber_goal || 30 },
        sugar: { current: Math.round(stats.totalSugar) },
        water: { current: water?.total || 0, goal: waterGoal?.water_goal || 8 },
        mealCount: stats.mealCount,
      },
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// GET /api/food-log/weekly — Weekly chart data
// ============================================
router.get('/weekly', (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';

    // Get last 7 days
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];

      const stats = db.prepare(`
        SELECT
          COALESCE(SUM(calories), 0) as calories,
          COALESCE(SUM(protein), 0) as protein,
          COALESCE(SUM(carbs), 0) as carbs,
          COALESCE(SUM(fat), 0) as fat
        FROM food_logs
        WHERE user_id = ? AND date = ?
      `).get(userId, dateStr);

      const user = db.prepare('SELECT calorie_goal FROM users WHERE id = ?').get(userId);

      days.push({
        day: dayName,
        date: dateStr,
        calories: Math.round(stats.calories),
        protein: Math.round(stats.protein),
        carbs: Math.round(stats.carbs),
        fat: Math.round(stats.fat),
        goal: user?.calorie_goal || 2200,
      });
    }

    res.json({ success: true, data: days });
  } catch (err) {
    console.error('Weekly data error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// GET /api/food-log/by-type — Breakdown by meal type
// ============================================
router.get('/by-type', (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const breakdown = db.prepare(`
      SELECT
        meal_type,
        COALESCE(SUM(calories), 0) as calories,
        COUNT(*) as count
      FROM food_logs
      WHERE user_id = ? AND date = ?
      GROUP BY meal_type
    `).all(userId, date);

    const result = {
      Breakfast: 0,
      Lunch: 0,
      Dinner: 0,
      Snack: 0,
    };

    for (const row of breakdown) {
      result[row.meal_type] = Math.round(row.calories);
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('By-type error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// POST /api/food-log — Add food entry
// ============================================
router.post('/', (req, res) => {
  try {
    const {
      userId = 'default-user',
      name,
      emoji = '🍽️',
      calories = 0,
      protein = 0,
      carbs = 0,
      fat = 0,
      fiber = 0,
      sugar = 0,
      mealType = 'Snack',
      mood = '',
      healthScore = 75,
      location = '',
      activity = '',
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing food name' });
    }

    const id = uuidv4();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const dateStr = now.toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO food_logs (id, user_id, name, emoji, calories, protein, carbs, fat, fiber, sugar,
        meal_type, mood, health_score, time, date, context_location, context_activity, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, userId, name, emoji, calories, protein, carbs, fat, fiber, sugar,
      mealType, mood, healthScore, timeStr, dateStr, location, activity, 'manual'
    );

    // Check achievements
    checkFoodLogAchievements(userId, dateStr, mealType, protein);

    const entry = db.prepare('SELECT * FROM food_logs WHERE id = ?').get(id);

    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    console.error('Add food log error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// PUT /api/food-log/:id — Update food entry
// ============================================
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;

    const existing = db.prepare('SELECT * FROM food_logs WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Food log entry not found' });
    }

    const allowedFields = ['name', 'emoji', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'meal_type', 'mood', 'health_score'];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (fields[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(fields[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    db.prepare(`UPDATE food_logs SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM food_logs WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update food log error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// DELETE /api/food-log/:id — Delete food entry
// ============================================
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM food_logs WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Food log entry not found' });
    }

    db.prepare('DELETE FROM food_logs WHERE id = ?').run(id);
    res.json({ success: true, message: 'Food log entry deleted' });
  } catch (err) {
    console.error('Delete food log error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// Achievement checks
// ============================================
function checkFoodLogAchievements(userId, date, mealType, protein) {
  const totalLogs = db.prepare(
    'SELECT COUNT(*) as c FROM food_logs WHERE user_id = ?'
  ).get(userId).c;

  // Century Club
  if (totalLogs >= 100) {
    try {
      db.prepare('INSERT OR IGNORE INTO achievements (id, user_id, achievement_key) VALUES (?, ?, ?)')
        .run(uuidv4(), userId, 'century_club');
    } catch (e) {}
  }

  // Veggie Lover — check 5 veggie logs
  const veggieCount = db.prepare(
    "SELECT COUNT(*) as c FROM food_logs WHERE user_id = ? AND date = ? AND (LOWER(name) LIKE '%broccoli%' OR LOWER(name) LIKE '%spinach%' OR LOWER(name) LIKE '%salad%' OR LOWER(name) LIKE '%carrot%' OR LOWER(name) LIKE '%vegetable%' OR LOWER(name) LIKE '%kale%')"
  ).get(userId, date).c;
  if (veggieCount >= 5) {
    try {
      db.prepare('INSERT OR IGNORE INTO achievements (id, user_id, achievement_key) VALUES (?, ?, ?)')
        .run(uuidv4(), userId, 'veggie_lover');
    } catch (e) {}
  }

  // Early Bird — breakfast logging
  if (mealType === 'Breakfast') {
    const breakfastDays = db.prepare(
      "SELECT COUNT(DISTINCT date) as c FROM food_logs WHERE user_id = ? AND meal_type = 'Breakfast'"
    ).get(userId).c;
    if (breakfastDays >= 10) {
      try {
        db.prepare('INSERT OR IGNORE INTO achievements (id, user_id, achievement_key) VALUES (?, ?, ?)')
          .run(uuidv4(), userId, 'early_bird');
      } catch (e) {}
    }
  }

  // Protein Pro
  const dayProtein = db.prepare(
    'SELECT COALESCE(SUM(protein), 0) as p FROM food_logs WHERE user_id = ? AND date = ?'
  ).get(userId, date).p;
  if (dayProtein >= 150) {
    try {
      db.prepare('INSERT OR IGNORE INTO achievements (id, user_id, achievement_key) VALUES (?, ?, ?)')
        .run(uuidv4(), userId, 'protein_pro');
    } catch (e) {}
  }

  // Macro Master — check all macros within 10% of goals
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (user) {
    const dayStats = db.prepare(`
      SELECT COALESCE(SUM(protein),0) as p, COALESCE(SUM(carbs),0) as c, COALESCE(SUM(fat),0) as f
      FROM food_logs WHERE user_id = ? AND date = ?
    `).get(userId, date);

    const pClose = Math.abs(dayStats.p - user.protein_goal) / user.protein_goal < 0.1;
    const cClose = Math.abs(dayStats.c - user.carbs_goal) / user.carbs_goal < 0.1;
    const fClose = Math.abs(dayStats.f - user.fat_goal) / user.fat_goal < 0.1;

    if (pClose && cClose && fClose) {
      try {
        db.prepare('INSERT OR IGNORE INTO achievements (id, user_id, achievement_key) VALUES (?, ?, ?)')
          .run(uuidv4(), userId, 'macro_master');
      } catch (e) {}
    }
  }
}

module.exports = router;
