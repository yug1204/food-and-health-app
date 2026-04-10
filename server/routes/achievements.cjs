/**
 * Achievements Routes
 * GET  /api/achievements       — Get all achievements with status
 * POST /api/achievements/check — Manually trigger achievement check
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db.cjs');

// All possible achievements
const ACHIEVEMENT_DEFS = [
  { key: 'first_scan', name: 'First Scan', desc: 'Scan your first food', icon: '📸', category: 'scan' },
  { key: 'week_warrior', name: 'Week Warrior', desc: '7-day streak', icon: '🔥', category: 'streak' },
  { key: 'hydration_hero', name: 'Hydration Hero', desc: 'Hit water goal 5 days', icon: '💧', category: 'water' },
  { key: 'macro_master', name: 'Macro Master', desc: 'Hit all macros in a day', icon: '🎯', category: 'nutrition' },
  { key: 'veggie_lover', name: 'Veggie Lover', desc: 'Log 5 servings of veggies', icon: '🥦', category: 'nutrition' },
  { key: 'meal_planner', name: 'Meal Planner', desc: 'Plan a full week', icon: '📋', category: 'planning' },
  { key: 'century_club', name: 'Century Club', desc: '100 meals logged', icon: '💯', category: 'logging' },
  { key: 'protein_pro', name: 'Protein Pro', desc: '150g protein in a day', icon: '💪', category: 'nutrition' },
  { key: 'early_bird', name: 'Early Bird', desc: 'Log breakfast 10 days', icon: '🌅', category: 'logging' },
  { key: 'iron_chef', name: 'Iron Chef', desc: 'Cook 25 meal plans', icon: '👨‍🍳', category: 'planning' },
  { key: 'streak_legend', name: 'Streak Legend', desc: '30-day streak', icon: '⭐', category: 'streak' },
  { key: 'health_guru', name: 'Health Guru', desc: 'Score 90+ for a week', icon: '🏆', category: 'health' },
  { key: 'scanner_pro', name: 'Scanner Pro', desc: 'Scan 50 foods', icon: '🔬', category: 'scan' },
  { key: 'water_master', name: 'Water Master', desc: 'Hit water goal 30 days', icon: '🌊', category: 'water' },
];

// GET /api/achievements
router.get('/', (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';

    const unlocked = db.prepare(
      'SELECT achievement_key, unlocked_at FROM achievements WHERE user_id = ?'
    ).all(userId);

    const unlockedMap = {};
    for (const u of unlocked) {
      unlockedMap[u.achievement_key] = u.unlocked_at;
    }

    const achievements = ACHIEVEMENT_DEFS.map(def => ({
      ...def,
      unlocked: !!unlockedMap[def.key],
      unlockedAt: unlockedMap[def.key] || null,
    }));

    // Calculate stats
    const totalUnlocked = achievements.filter(a => a.unlocked).length;
    const total = achievements.length;
    const level = totalUnlocked >= 10 ? 'Platinum' : totalUnlocked >= 7 ? 'Gold' : totalUnlocked >= 4 ? 'Silver' : 'Bronze';

    res.json({
      success: true,
      data: {
        achievements,
        stats: {
          totalUnlocked,
          total,
          level,
          progress: Math.round((totalUnlocked / total) * 100),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/achievements/check — Run full achievement check
router.post('/check', (req, res) => {
  try {
    const userId = req.body.userId || 'default-user';
    const newlyUnlocked = [];

    // Check each achievement
    const totalScans = db.prepare(
      'SELECT COUNT(*) as c FROM scan_history WHERE user_id = ?'
    ).get(userId).c;
    if (totalScans >= 1) check('first_scan');
    if (totalScans >= 50) check('scanner_pro');

    const totalLogs = db.prepare(
      'SELECT COUNT(*) as c FROM food_logs WHERE user_id = ?'
    ).get(userId).c;
    if (totalLogs >= 100) check('century_club');

    // Streak checks
    const streak = calculateStreak(userId);
    if (streak >= 7) check('week_warrior');
    if (streak >= 30) check('streak_legend');

    // Breakfast count
    const breakfastDays = db.prepare(
      "SELECT COUNT(DISTINCT date) as c FROM food_logs WHERE user_id = ? AND meal_type = 'Breakfast'"
    ).get(userId).c;
    if (breakfastDays >= 10) check('early_bird');

    // Meal plan cooking
    const cookedPlans = db.prepare(
      'SELECT COUNT(*) as c FROM meal_plans WHERE user_id = ? AND is_cooked = 1'
    ).get(userId).c;
    if (cookedPlans >= 25) check('iron_chef');

    function check(key) {
      try {
        const result = db.prepare(
          'INSERT OR IGNORE INTO achievements (id, user_id, achievement_key) VALUES (?, ?, ?)'
        ).run(uuidv4(), userId, key);
        if (result.changes > 0) newlyUnlocked.push(key);
      } catch (e) {}
    }

    res.json({
      success: true,
      newlyUnlocked,
      message: newlyUnlocked.length > 0
        ? `Unlocked ${newlyUnlocked.length} new achievement(s)!`
        : 'No new achievements unlocked',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Weekly challenges progress
router.get('/challenges', (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const today = new Date().toISOString().split('T')[0];
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    // Challenge 1: Protein Champion — 140g for 3 days
    const proteinDays = db.prepare(`
      SELECT COUNT(*) as c FROM (
        SELECT date, SUM(protein) as p FROM food_logs
        WHERE user_id = ? GROUP BY date HAVING p >= ?
      )
    `).get(userId, user?.protein_goal || 140).c;

    // Challenge 2: Veggie Sprint — 5 veggie logs today
    const veggieToday = db.prepare(`
      SELECT COUNT(*) as c FROM food_logs
      WHERE user_id = ? AND date = ? AND (
        LOWER(name) LIKE '%broccoli%' OR LOWER(name) LIKE '%spinach%' OR
        LOWER(name) LIKE '%salad%' OR LOWER(name) LIKE '%carrot%' OR
        LOWER(name) LIKE '%vegetable%' OR LOWER(name) LIKE '%kale%' OR
        LOWER(name) LIKE '%tomato%' OR LOWER(name) LIKE '%pepper%'
      )
    `).get(userId, today).c;

    // Challenge 3: Hydration Master — water goal 5 days
    const waterDays = db.prepare(`
      SELECT COUNT(*) as c FROM (
        SELECT date, SUM(glasses) as t FROM water_logs
        WHERE user_id = ? GROUP BY date HAVING t >= ?
      )
    `).get(userId, user?.water_goal || 8).c;

    const challenges = [
      {
        name: 'Protein Champion',
        desc: `Hit ${user?.protein_goal || 140}g protein for 3 consecutive days`,
        emoji: '💪',
        reward: '+50 XP',
        progress: Math.min(Math.round((proteinDays / 3) * 100), 100),
        done: proteinDays >= 3,
      },
      {
        name: 'Veggie Sprint',
        desc: 'Eat 5 servings of vegetables today',
        emoji: '🥦',
        reward: '+30 XP',
        progress: Math.min(Math.round((veggieToday / 5) * 100), 100),
        done: veggieToday >= 5,
      },
      {
        name: 'Hydration Master',
        desc: `Drink ${user?.water_goal || 8} glasses of water for 5 days`,
        emoji: '💧',
        reward: '+40 XP',
        progress: Math.min(Math.round((waterDays / 5) * 100), 100),
        done: waterDays >= 5,
      },
    ];

    res.json({ success: true, data: challenges });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function calculateStreak(userId) {
  const dates = db.prepare(
    'SELECT DISTINCT date FROM food_logs WHERE user_id = ? ORDER BY date DESC'
  ).all(userId).map(r => r.date);

  if (dates.length === 0) return 0;

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dates[0] !== today && dates[0] !== yesterdayStr) return 0;

  let checkDate = new Date(dates[0]);
  for (const dateStr of dates) {
    if (dateStr === checkDate.toISOString().split('T')[0]) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else break;
  }
  return streak;
}

module.exports = router;
