/**
 * User Profile Routes
 * GET    /api/user          — Get user profile
 * PUT    /api/user          — Update user profile
 * PUT    /api/user/goals    — Update nutrition goals
 * PUT    /api/user/settings — Update app settings
 * GET    /api/user/streak   — Get current streak
 */
const express = require('express');
const router = express.Router();
const db = require('../db.cjs');

// GET /api/user
router.get('/', (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Parse JSON fields
    user.dietary_restrictions = JSON.parse(user.dietary_restrictions || '[]');
    user.allergies = JSON.parse(user.allergies || '[]');
    user.preferences = JSON.parse(user.preferences || '[]');

    // Calculate stats
    const totalMeals = db.prepare(
      'SELECT COUNT(*) as c FROM food_logs WHERE user_id = ?'
    ).get(userId).c;

    const streak = calculateStreak(userId);
    const healthScore = calculateHealthScore(userId);

    res.json({
      success: true,
      data: {
        ...user,
        totalMeals,
        streak,
        healthScore,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/user
router.put('/', (req, res) => {
  try {
    const userId = req.body.userId || 'default-user';
    const {
      name, email, age, weight, height, goal, activity_level,
      dietary_restrictions, allergies, preferences,
    } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (age !== undefined) { updates.push('age = ?'); values.push(age); }
    if (weight !== undefined) { updates.push('weight = ?'); values.push(weight); }
    if (height !== undefined) { updates.push('height = ?'); values.push(height); }
    if (goal !== undefined) { updates.push('goal = ?'); values.push(goal); }
    if (activity_level !== undefined) { updates.push('activity_level = ?'); values.push(activity_level); }
    if (dietary_restrictions !== undefined) { updates.push('dietary_restrictions = ?'); values.push(JSON.stringify(dietary_restrictions)); }
    if (allergies !== undefined) { updates.push('allergies = ?'); values.push(JSON.stringify(allergies)); }
    if (preferences !== undefined) { updates.push('preferences = ?'); values.push(JSON.stringify(preferences)); }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(userId);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    user.dietary_restrictions = JSON.parse(user.dietary_restrictions || '[]');
    user.allergies = JSON.parse(user.allergies || '[]');
    user.preferences = JSON.parse(user.preferences || '[]');

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/user/goals
router.put('/goals', (req, res) => {
  try {
    const userId = req.body.userId || 'default-user';
    const { calorie_goal, protein_goal, carbs_goal, fat_goal, fiber_goal, water_goal } = req.body;

    const updates = [];
    const values = [];

    if (calorie_goal !== undefined) { updates.push('calorie_goal = ?'); values.push(calorie_goal); }
    if (protein_goal !== undefined) { updates.push('protein_goal = ?'); values.push(protein_goal); }
    if (carbs_goal !== undefined) { updates.push('carbs_goal = ?'); values.push(carbs_goal); }
    if (fat_goal !== undefined) { updates.push('fat_goal = ?'); values.push(fat_goal); }
    if (fiber_goal !== undefined) { updates.push('fiber_goal = ?'); values.push(fiber_goal); }
    if (water_goal !== undefined) { updates.push('water_goal = ?'); values.push(water_goal); }

    if (updates.length > 0) {
      values.push(userId);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/user/settings
router.put('/settings', (req, res) => {
  try {
    const userId = req.body.userId || 'default-user';
    const { notifications, meal_reminders, water_reminders, dark_mode } = req.body;

    const updates = [];
    const values = [];

    if (notifications !== undefined) { updates.push('notifications = ?'); values.push(notifications ? 1 : 0); }
    if (meal_reminders !== undefined) { updates.push('meal_reminders = ?'); values.push(meal_reminders ? 1 : 0); }
    if (water_reminders !== undefined) { updates.push('water_reminders = ?'); values.push(water_reminders ? 1 : 0); }
    if (dark_mode !== undefined) { updates.push('dark_mode = ?'); values.push(dark_mode ? 1 : 0); }

    if (updates.length > 0) {
      values.push(userId);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/streak
router.get('/streak', (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const streak = calculateStreak(userId);
    const bestStreak = calculateBestStreak(userId);

    // Check streak achievements
    const { v4: uuidv4 } = require('uuid');
    if (streak >= 7) {
      try {
        db.prepare('INSERT OR IGNORE INTO achievements (id, user_id, achievement_key) VALUES (?, ?, ?)')
          .run(uuidv4(), userId, 'week_warrior');
      } catch (e) {}
    }
    if (streak >= 30) {
      try {
        db.prepare('INSERT OR IGNORE INTO achievements (id, user_id, achievement_key) VALUES (?, ?, ?)')
          .run(uuidv4(), userId, 'streak_legend');
      } catch (e) {}
    }

    res.json({
      success: true,
      data: { current: streak, best: bestStreak },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// Helpers
// ============================================
function calculateStreak(userId) {
  const dates = db.prepare(`
    SELECT DISTINCT date FROM food_logs
    WHERE user_id = ?
    ORDER BY date DESC
  `).all(userId).map(r => r.date);

  if (dates.length === 0) return 0;

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];

  // Check if today or yesterday is in the list
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dates[0] !== today && dates[0] !== yesterdayStr) return 0;

  let checkDate = new Date(dates[0]);
  for (const dateStr of dates) {
    const d = new Date(dateStr);
    const expected = checkDate.toISOString().split('T')[0];

    if (dateStr === expected) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function calculateBestStreak(userId) {
  const dates = db.prepare(`
    SELECT DISTINCT date FROM food_logs
    WHERE user_id = ?
    ORDER BY date ASC
  `).all(userId).map(r => r.date);

  if (dates.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

function calculateHealthScore(userId) {
  const today = new Date().toISOString().split('T')[0];
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return 50;

  let score = 50;

  // Factor 1: Streak consistency (+25 max)
  const streak = calculateStreak(userId);
  score += Math.min(streak * 2, 25);

  // Factor 2: Today's macro balance (+15 max)
  const stats = db.prepare(`
    SELECT COALESCE(SUM(protein),0) as p, COALESCE(SUM(carbs),0) as c, COALESCE(SUM(fat),0) as f
    FROM food_logs WHERE user_id = ? AND date = ?
  `).get(userId, today);

  if (stats.p > 0) {
    const pRatio = Math.min(stats.p / user.protein_goal, 1);
    const cRatio = Math.min(stats.c / user.carbs_goal, 1);
    const fRatio = Math.min(stats.f / user.fat_goal, 1);
    score += Math.round((pRatio + cRatio + fRatio) / 3 * 15);
  }

  // Factor 3: Hydration (+10 max)
  const water = db.prepare(`
    SELECT COALESCE(SUM(glasses), 0) as t FROM water_logs WHERE user_id = ? AND date = ?
  `).get(userId, today);
  score += Math.min(Math.round((water.t / user.water_goal) * 10), 10);

  return Math.min(100, Math.max(10, score));
}

module.exports = router;
