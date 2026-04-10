/**
 * Insights Routes — AI-powered pattern analysis
 * GET /api/insights           — Get all insights
 * GET /api/insights/patterns  — Eating patterns
 * GET /api/insights/nutrient-balance — Nutrient radar data
 * GET /api/insights/mood-correlation — Mood-calorie correlation
 */
const express = require('express');
const router = express.Router();
const db = require('../db.cjs');

// GET /api/insights
router.get('/', (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const today = new Date().toISOString().split('T')[0];

    const insights = [];

    // Analyze last 7 days of data
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const dayStats = db.prepare(`
        SELECT COALESCE(SUM(calories),0) as cal, COALESCE(SUM(protein),0) as pro,
               COALESCE(SUM(carbs),0) as carb, COALESCE(SUM(fat),0) as fat,
               COALESCE(SUM(fiber),0) as fiber, COUNT(*) as meals
        FROM food_logs WHERE user_id = ? AND date = ?
      `).get(userId, dateStr);

      last7Days.push({ date: dateStr, ...dayStats });
    }

    const activeDays = last7Days.filter(d => d.meals > 0);

    // Insight 1: Late-night eating pattern
    const lateNightLogs = db.prepare(`
      SELECT COUNT(*) as c FROM food_logs
      WHERE user_id = ? AND (time LIKE '%PM' AND (time LIKE '9:%' OR time LIKE '10:%' OR time LIKE '11:%'))
      AND date >= date('now', '-7 days')
    `).get(userId).c;

    if (lateNightLogs >= 2) {
      insights.push({
        id: 'late_night',
        type: 'pattern',
        icon: '🌙',
        title: 'Late-Night Snacking Detected',
        description: `You had ${lateNightLogs} late-night meals this week. Try having herbal tea or a light snack like nuts instead.`,
        tag: 'Behavior Pattern',
        tagColor: 'orange',
        severity: 'warning',
      });
    }

    // Insight 2: Fiber intake
    if (activeDays.length > 0) {
      const avgFiber = activeDays.reduce((s, d) => s + d.fiber, 0) / activeDays.length;
      const fiberGoal = user?.fiber_goal || 30;
      if (avgFiber < fiberGoal * 0.7) {
        insights.push({
          id: 'low_fiber',
          type: 'nutrition',
          icon: '🥬',
          title: 'Fiber Intake Below Target',
          description: `Average daily fiber is ${Math.round(avgFiber)}g vs. your ${fiberGoal}g goal. Add more leafy greens, beans, and whole grains.`,
          tag: 'Nutrition Gap',
          tagColor: 'red',
          severity: 'important',
        });
      }
    }

    // Insight 3: Protein consistency
    if (activeDays.length >= 3) {
      const proteinGoal = user?.protein_goal || 140;
      const goodProteinDays = activeDays.filter(d => d.pro >= proteinGoal * 0.9).length;
      if (goodProteinDays >= 3) {
        insights.push({
          id: 'protein_good',
          type: 'positive',
          icon: '💪',
          title: 'Protein Consistency Improving',
          description: `Your protein intake has been within 10% of your goal for ${goodProteinDays} days. Keep it up!`,
          tag: 'Great Progress',
          tagColor: 'green',
          severity: 'positive',
        });
      }
    }

    // Insight 4: Healthy fat recommendation
    if (activeDays.length > 0) {
      const avgFat = activeDays.reduce((s, d) => s + d.fat, 0) / activeDays.length;
      const fatGoal = user?.fat_goal || 70;
      if (avgFat < fatGoal * 0.6) {
        insights.push({
          id: 'healthy_fats',
          type: 'suggestion',
          icon: '🥑',
          title: 'Consider More Healthy Fats',
          description: 'Add more omega-3 rich foods like salmon, walnuts, and flaxseeds. Your fat intake has been below target.',
          tag: 'Recommendation',
          tagColor: 'blue',
          severity: 'info',
        });
      }
    }

    // Insight 5: Calorie spike pattern
    if (activeDays.length >= 5) {
      const avgCal = activeDays.reduce((s, d) => s + d.cal, 0) / activeDays.length;
      const spikeDays = activeDays.filter(d => d.cal > avgCal * 1.2);
      if (spikeDays.length >= 2) {
        insights.push({
          id: 'calorie_spike',
          type: 'pattern',
          icon: '📈',
          title: 'Calorie Spikes Detected',
          description: `You had ${spikeDays.length} days with calorie intake 20%+ above average. Consider more balanced portions.`,
          tag: 'Behavior Pattern',
          tagColor: 'orange',
          severity: 'warning',
        });
      }
    }

    // Insight 6: Hydration streak
    const waterDays = db.prepare(`
      SELECT COUNT(DISTINCT date) as c FROM (
        SELECT date, SUM(glasses) as t FROM water_logs
        WHERE user_id = ? AND date >= date('now', '-7 days')
        GROUP BY date HAVING t >= ?
      )
    `).get(userId, user?.water_goal || 8).c;

    if (waterDays >= 3) {
      insights.push({
        id: 'hydration_streak',
        type: 'positive',
        icon: '💦',
        title: `Hydration Streak — ${waterDays} Days`,
        description: "Keep hitting your water goal! Proper hydration supports metabolism and energy levels.",
        tag: 'Achievement',
        tagColor: 'green',
        severity: 'positive',
      });
    }

    // Insight 7: Meal regularity
    if (activeDays.length > 0) {
      const avgMeals = activeDays.reduce((s, d) => s + d.meals, 0) / activeDays.length;
      if (avgMeals < 3) {
        insights.push({
          id: 'meal_regularity',
          type: 'suggestion',
          icon: '⏰',
          title: 'Log More Regular Meals',
          description: `You're averaging ${Math.round(avgMeals * 10) / 10} meals/day. Try to log at least 3 meals for better tracking and nutrition balance.`,
          tag: 'Recommendation',
          tagColor: 'blue',
          severity: 'info',
        });
      }
    }

    // Default insights if no data
    if (insights.length === 0) {
      insights.push({
        id: 'welcome',
        type: 'suggestion',
        icon: '👋',
        title: 'Start Logging to Get Insights',
        description: 'Log meals, track water, and scan foods to get personalized AI insights about your eating patterns.',
        tag: 'Getting Started',
        tagColor: 'blue',
        severity: 'info',
      });
    }

    res.json({ success: true, data: insights });
  } catch (err) {
    console.error('Insights error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/insights/patterns
router.get('/patterns', (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';

    // Late night eating
    const lateNight = db.prepare(`
      SELECT COUNT(*) as c FROM food_logs
      WHERE user_id = ? AND (time LIKE '%PM' AND (time LIKE '9:%' OR time LIKE '10:%' OR time LIKE '11:%'))
      AND date >= date('now', '-7 days')
    `).get(userId).c;

    // Morning routine
    const morningMeals = db.prepare(`
      SELECT COUNT(DISTINCT date) as c FROM food_logs
      WHERE user_id = ? AND meal_type = 'Breakfast'
      AND date >= date('now', '-7 days')
    `).get(userId).c;

    // Post-workout (snacks logged)
    const snackCount = db.prepare(`
      SELECT COUNT(*) as c FROM food_logs
      WHERE user_id = ? AND meal_type = 'Snack'
      AND date >= date('now', '-7 days')
    `).get(userId).c;

    // Meal spacing (meals per day average)
    const totalMeals = db.prepare(`
      SELECT COUNT(*) as c FROM food_logs
      WHERE user_id = ? AND date >= date('now', '-7 days')
    `).get(userId).c;

    const patterns = [
      {
        icon: 'Moon',
        label: 'Late Night Eating',
        frequency: lateNight > 0 ? `${lateNight}x this week` : 'None detected',
        trend: lateNight > 3 ? 'increasing' : lateNight > 0 ? 'stable' : 'none',
        color: 'var(--accent-500)',
      },
      {
        icon: 'Sun',
        label: 'Morning Routine',
        frequency: morningMeals >= 5 ? 'Consistent' : `${morningMeals}/7 days`,
        trend: morningMeals >= 5 ? 'stable' : morningMeals >= 3 ? 'improving' : 'needs work',
        color: 'var(--primary-500)',
      },
      {
        icon: 'Activity',
        label: 'Snacking Habits',
        frequency: `${snackCount}x this week`,
        trend: snackCount > 10 ? 'increasing' : 'stable',
        color: 'var(--info)',
      },
      {
        icon: 'Clock',
        label: 'Meal Frequency',
        frequency: totalMeals > 0 ? `${Math.round(totalMeals / 7 * 10) / 10} meals/day` : 'No data',
        trend: totalMeals / 7 >= 3 ? 'stable' : 'needs work',
        color: 'var(--secondary-500)',
      },
    ];

    res.json({ success: true, data: patterns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/insights/nutrient-balance
router.get('/nutrient-balance', (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const today = new Date().toISOString().split('T')[0];

    // Average over last 7 days
    const avg = db.prepare(`
      SELECT
        COALESCE(AVG(daily_pro), 0) as protein,
        COALESCE(AVG(daily_carb), 0) as carbs,
        COALESCE(AVG(daily_fat), 0) as fat,
        COALESCE(AVG(daily_fiber), 0) as fiber
      FROM (
        SELECT date, SUM(protein) as daily_pro, SUM(carbs) as daily_carb,
               SUM(fat) as daily_fat, SUM(fiber) as daily_fiber
        FROM food_logs WHERE user_id = ? AND date >= date('now', '-7 days')
        GROUP BY date
      )
    `).get(userId);

    // Calculate as percentage of goal
    const proteinScore = Math.min(Math.round((avg.protein / (user?.protein_goal || 140)) * 100), 100);
    const carbsScore = Math.min(Math.round((avg.carbs / (user?.carbs_goal || 250)) * 100), 100);
    const fatScore = Math.min(Math.round((avg.fat / (user?.fat_goal || 70)) * 100), 100);
    const fiberScore = Math.min(Math.round((avg.fiber / (user?.fiber_goal || 30)) * 100), 100);

    // Water score
    const waterAvg = db.prepare(`
      SELECT COALESCE(AVG(daily_water), 0) as avg FROM (
        SELECT date, SUM(glasses) as daily_water
        FROM water_logs WHERE user_id = ? AND date >= date('now', '-7 days')
        GROUP BY date
      )
    `).get(userId);
    const hydrationScore = Math.min(Math.round((waterAvg.avg / (user?.water_goal || 8)) * 100), 100);

    // Vitamin estimate based on food variety
    const foodVariety = db.prepare(`
      SELECT COUNT(DISTINCT name) as c FROM food_logs
      WHERE user_id = ? AND date >= date('now', '-7 days')
    `).get(userId).c;
    const vitaminScore = Math.min(foodVariety * 10, 100);

    const data = [
      { subject: 'Protein', A: proteinScore || 10, fullMark: 100 },
      { subject: 'Carbs', A: carbsScore || 10, fullMark: 100 },
      { subject: 'Fat', A: fatScore || 10, fullMark: 100 },
      { subject: 'Fiber', A: fiberScore || 10, fullMark: 100 },
      { subject: 'Vitamins', A: vitaminScore || 10, fullMark: 100 },
      { subject: 'Hydration', A: hydrationScore || 10, fullMark: 100 },
    ];

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/insights/mood-correlation
router.get('/mood-correlation', (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const today = new Date().toISOString().split('T')[0];

    // Get today's food log with running calorie total
    const logs = db.prepare(`
      SELECT time, calories, mood FROM food_logs
      WHERE user_id = ? AND date = ?
      ORDER BY created_at ASC
    `).all(userId, today);

    const moodScores = {
      happy: 90, relaxed: 85, energized: 95, satisfied: 88,
      focused: 82, stressed: 40, tired: 35, frustrated: 30,
      '': 70,
    };

    let runningCalories = 0;
    const dataPoints = [{ time: '6AM', calories: 0, mood: 70 }];

    for (const log of logs) {
      runningCalories += log.calories;
      dataPoints.push({
        time: log.time || '',
        calories: Math.round(runningCalories),
        mood: moodScores[log.mood] || 70,
      });
    }

    // Fill in to end of day if we have data
    if (logs.length > 0) {
      dataPoints.push({
        time: 'Now',
        calories: Math.round(runningCalories),
        mood: moodScores[logs[logs.length - 1].mood] || 70,
      });
    }

    res.json({ success: true, data: dataPoints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/insights/summary — AI weekly summary
router.get('/summary', (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    const activeDays = db.prepare(`
      SELECT date, SUM(calories) as cal, SUM(protein) as pro,
             SUM(carbs) as carb, SUM(fat) as fat, SUM(fiber) as fiber, COUNT(*) as meals
      FROM food_logs WHERE user_id = ? AND date >= date('now', '-7 days')
      GROUP BY date ORDER BY date DESC
    `).all(userId);

    if (activeDays.length === 0) {
      return res.json({
        success: true,
        data: {
          summary: "Welcome to NutriSense! Start logging your meals to receive personalized AI insights and weekly summaries.",
        },
      });
    }

    const avgCal = Math.round(activeDays.reduce((s, d) => s + d.cal, 0) / activeDays.length);
    const avgPro = Math.round(activeDays.reduce((s, d) => s + d.pro, 0) / activeDays.length);
    const avgFiber = Math.round(activeDays.reduce((s, d) => s + d.fiber, 0) / activeDays.length);

    const proteinGoal = user?.protein_goal || 140;
    const fiberGoal = user?.fiber_goal || 30;
    const calGoal = user?.calorie_goal || 2200;

    const goodProteinDays = activeDays.filter(d => d.pro >= proteinGoal * 0.9).length;

    let summary = '';

    if (goodProteinDays >= 4) {
      summary += `**Great progress this week!** Your protein consistency has improved significantly, maintaining within 10% of your ${proteinGoal}g goal for ${goodProteinDays} out of ${activeDays.length} days.\n\n`;
    } else {
      summary += `**Your weekly overview:** You've logged meals on ${activeDays.length} days with an average of ${avgCal} kcal/day (goal: ${calGoal} kcal).\n\n`;
    }

    if (avgFiber < fiberGoal * 0.7) {
      summary += `**Areas to focus on:** Fiber intake remains below target at an average of ${avgFiber}g/day (goal: ${fiberGoal}g). Consider adding more legumes, whole grains, and leafy greens.\n\n`;
    }

    summary += `**Recommendation:** ${avgPro < proteinGoal * 0.8 ? 'Focus on adding more protein-rich foods like lean meats, eggs, and legumes to meet your daily goals.' : 'Keep up the great work with your nutrition balance! Consider exploring new healthy recipes to maintain variety.'}`;

    res.json({ success: true, data: { summary, avgCal, avgPro, avgFiber, activeDays: activeDays.length } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
