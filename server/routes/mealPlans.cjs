/**
 * Meal Plan Routes
 * GET  /api/meal-plans           — Get meal plans for a week
 * POST /api/meal-plans/generate  — Generate new meal plan
 * PUT  /api/meal-plans/:id/cook  — Mark as cooked
 * PUT  /api/meal-plans/:id/fav   — Toggle favorite
 * POST /api/meal-plans/swap      — Swap a meal
 * GET  /api/meal-plans/fridge    — Get fridge items
 * POST /api/meal-plans/fridge    — Add fridge item
 * DELETE /api/meal-plans/fridge/:id — Remove fridge item
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db.cjs');

// Meal templates for generation
const MEAL_TEMPLATES = {
  Breakfast: [
    { name: 'Berry Overnight Oats', desc: 'Steel-cut oats with mixed berries, chia seeds, and almond butter', calories: 380, protein: 18, carbs: 48, fat: 14, prepTime: 10, tags: ['Quick', 'Fiber-Rich'], image: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&h=300&fit=crop', healthScore: 91 },
    { name: 'Greek Yogurt Bowl', desc: 'Greek yogurt with granola, honey, and fresh fruit', calories: 320, protein: 24, carbs: 38, fat: 8, prepTime: 5, tags: ['Quick', 'High Protein'], image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop', healthScore: 88 },
    { name: 'Avocado Toast', desc: 'Whole grain toast with smashed avocado, poached egg, and chili flakes', calories: 350, protein: 14, carbs: 30, fat: 20, prepTime: 10, tags: ['Trendy', 'Healthy Fats'], image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&h=300&fit=crop', healthScore: 85 },
    { name: 'Spinach Egg Scramble', desc: 'Scrambled eggs with spinach, tomatoes, and feta cheese', calories: 290, protein: 22, carbs: 8, fat: 18, prepTime: 10, tags: ['Keto-Friendly', 'Low Carb'], image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop', healthScore: 86 },
    { name: 'Protein Pancakes', desc: 'Banana oat pancakes with protein powder and maple syrup', calories: 410, protein: 28, carbs: 52, fat: 10, prepTime: 15, tags: ['High Protein', 'Sweet'], image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop', healthScore: 78 },
  ],
  Lunch: [
    { name: 'Mediterranean Power Bowl', desc: 'Quinoa, grilled chicken, roasted vegetables, feta, and tzatziki', calories: 520, protein: 38, carbs: 52, fat: 18, prepTime: 25, tags: ['High Protein', 'Mediterranean'], image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', healthScore: 94 },
    { name: 'Turkey & Avocado Wrap', desc: 'Whole wheat wrap with turkey, avocado, greens, and hummus', calories: 420, protein: 32, carbs: 38, fat: 16, prepTime: 10, tags: ['Quick', 'Portable'], image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop', healthScore: 87 },
    { name: 'Asian Chicken Salad', desc: 'Mixed greens, grilled chicken, mandarin oranges, and sesame ginger dressing', calories: 380, protein: 35, carbs: 28, fat: 14, prepTime: 15, tags: ['Asian-Inspired', 'Light'], image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', healthScore: 89 },
    { name: 'Lentil Soup', desc: 'Hearty red lentil soup with cumin, turmeric, and crusty bread', calories: 350, protein: 20, carbs: 50, fat: 6, prepTime: 30, tags: ['Plant-Based', 'Comfort'], image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop', healthScore: 90 },
    { name: 'Grilled Chicken Caesar', desc: 'Classic caesar salad with grilled chicken and parmesan', calories: 450, protein: 40, carbs: 18, fat: 24, prepTime: 15, tags: ['Classic', 'High Protein'], image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop', healthScore: 82 },
  ],
  Dinner: [
    { name: 'Teriyaki Salmon Bowl', desc: 'Wild salmon, brown rice, edamame, avocado, and sesame dressing', calories: 580, protein: 42, carbs: 55, fat: 22, prepTime: 30, tags: ['Omega-3', 'Asian-Inspired'], image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop', healthScore: 96 },
    { name: 'Chickpea Buddha Bowl', desc: 'Roasted chickpeas, sweet potato, kale, tahini dressing', calories: 450, protein: 22, carbs: 58, fat: 15, prepTime: 35, tags: ['Vegan', 'Fiber-Rich'], image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', healthScore: 93 },
    { name: 'Grilled Chicken & Veggies', desc: 'Herb-marinated chicken breast with roasted seasonal vegetables', calories: 420, protein: 45, carbs: 20, fat: 16, prepTime: 25, tags: ['Classic', 'High Protein'], image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop', healthScore: 92 },
    { name: 'Shrimp Stir-Fry', desc: 'Shrimp with mixed vegetables in garlic soy sauce over jasmine rice', calories: 480, protein: 32, carbs: 52, fat: 14, prepTime: 20, tags: ['Quick', 'Asian-Inspired'], image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop', healthScore: 85 },
    { name: 'Turkey Meatball Pasta', desc: 'Lean turkey meatballs with whole wheat pasta and marinara sauce', calories: 510, protein: 35, carbs: 58, fat: 15, prepTime: 30, tags: ['Italian', 'Comfort'], image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop', healthScore: 80 },
  ],
  Snack: [
    { name: 'Green Goddess Smoothie', desc: 'Spinach, banana, protein powder, almond milk, and spirulina', calories: 260, protein: 28, carbs: 32, fat: 6, prepTime: 5, tags: ['Quick', 'Detox'], image: 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=400&h=300&fit=crop', healthScore: 89 },
    { name: 'Apple & Almond Butter', desc: 'Sliced apple with 2 tbsp natural almond butter', calories: 200, protein: 6, carbs: 22, fat: 12, prepTime: 2, tags: ['Quick', 'Simple'], image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=300&fit=crop', healthScore: 85 },
    { name: 'Protein Energy Balls', desc: 'Oats, protein powder, peanut butter, and dark chocolate chips', calories: 180, protein: 10, carbs: 20, fat: 8, prepTime: 15, tags: ['Meal Prep', 'Portable'], image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop', healthScore: 82 },
  ],
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// GET /api/meal-plans
router.get('/', (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const weekStart = req.query.weekStart || getWeekStart();

    const plans = db.prepare(`
      SELECT * FROM meal_plans
      WHERE user_id = ? AND week_start = ?
      ORDER BY CASE day
        WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
        WHEN 'Sunday' THEN 7 END,
        CASE meal_type
        WHEN 'Breakfast' THEN 1 WHEN 'Lunch' THEN 2 WHEN 'Snack' THEN 3 WHEN 'Dinner' THEN 4 END
    `).all(userId, weekStart);

    // Parse tags
    const parsed = plans.map(p => ({
      ...p,
      tags: JSON.parse(p.tags || '[]'),
    }));

    // Group by day
    const byDay = {};
    for (const day of DAYS) {
      byDay[day] = parsed.filter(p => p.day === day);
    }

    res.json({ success: true, data: byDay, weekStart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/meal-plans/generate
router.post('/generate', (req, res) => {
  try {
    const userId = req.body.userId || 'default-user';
    const weekStart = req.body.weekStart || getWeekStart();
    const daysToGenerate = req.body.days || DAYS.slice(0, 5); // Mon-Fri by default

    // Get user preferences
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const allergies = JSON.parse(user?.allergies || '[]');

    // Clear existing plan for this week
    db.prepare('DELETE FROM meal_plans WHERE user_id = ? AND week_start = ?').run(userId, weekStart);

    const insertStmt = db.prepare(`
      INSERT INTO meal_plans (id, user_id, week_start, day, meal_type, name, description,
        calories, protein, carbs, fat, prep_time, tags, image, health_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const generated = {};

    for (const day of daysToGenerate) {
      generated[day] = [];
      for (const mealType of ['Breakfast', 'Lunch', 'Dinner']) {
        const templates = MEAL_TEMPLATES[mealType];
        const template = templates[Math.floor(Math.random() * templates.length)];

        const id = uuidv4();
        insertStmt.run(
          id, userId, weekStart, day, mealType, template.name, template.desc,
          template.calories, template.protein, template.carbs, template.fat,
          template.prepTime, JSON.stringify(template.tags), template.image, template.healthScore
        );

        generated[day].push({
          id, day, meal_type: mealType, ...template,
          tags: template.tags,
          week_start: weekStart,
          is_cooked: 0,
          is_favorite: 0,
        });
      }
    }

    // Check meal planner achievement
    if (daysToGenerate.length >= 7) {
      try {
        db.prepare('INSERT OR IGNORE INTO achievements (id, user_id, achievement_key) VALUES (?, ?, ?)')
          .run(uuidv4(), userId, 'meal_planner');
      } catch (e) {}
    }

    res.json({
      success: true,
      message: `Generated meal plan for ${daysToGenerate.length} days`,
      data: generated,
      weekStart,
    });
  } catch (err) {
    console.error('Generate meal plan error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/meal-plans/:id/cook
router.put('/:id/cook', (req, res) => {
  try {
    const { id } = req.params;

    const plan = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(id);
    if (!plan) return res.status(404).json({ error: 'Meal plan not found' });

    const newValue = plan.is_cooked ? 0 : 1;
    db.prepare('UPDATE meal_plans SET is_cooked = ? WHERE id = ?').run(newValue, id);

    // If marking as cooked, also add to food log
    if (newValue === 1) {
      const foodLogId = uuidv4();
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const dateStr = now.toISOString().split('T')[0];

      db.prepare(`
        INSERT INTO food_logs (id, user_id, name, emoji, calories, protein, carbs, fat,
          meal_type, health_score, time, date, source)
        VALUES (?, ?, ?, '🍽️', ?, ?, ?, ?, ?, ?, ?, ?, 'meal_plan')
      `).run(
        foodLogId, plan.user_id, plan.name, plan.calories, plan.protein, plan.carbs, plan.fat,
        plan.meal_type, plan.health_score, timeStr, dateStr
      );

      // Check iron chef achievement
      const cooked = db.prepare(
        'SELECT COUNT(*) as c FROM meal_plans WHERE user_id = ? AND is_cooked = 1'
      ).get(plan.user_id).c;
      if (cooked >= 25) {
        try {
          db.prepare('INSERT OR IGNORE INTO achievements (id, user_id, achievement_key) VALUES (?, ?, ?)')
            .run(uuidv4(), plan.user_id, 'iron_chef');
        } catch (e) {}
      }
    }

    res.json({ success: true, cooked: !!newValue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/meal-plans/:id/fav
router.put('/:id/fav', (req, res) => {
  try {
    const { id } = req.params;
    const plan = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(id);
    if (!plan) return res.status(404).json({ error: 'Not found' });

    const newValue = plan.is_favorite ? 0 : 1;
    db.prepare('UPDATE meal_plans SET is_favorite = ? WHERE id = ?').run(newValue, id);

    res.json({ success: true, favorite: !!newValue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/meal-plans/swap
router.post('/swap', (req, res) => {
  try {
    const { planId, userId = 'default-user' } = req.body;

    const plan = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(planId);
    if (!plan) return res.status(404).json({ error: 'Not found' });

    const templates = MEAL_TEMPLATES[plan.meal_type] || MEAL_TEMPLATES['Lunch'];
    const currentName = plan.name;

    // Pick a different meal
    const alternatives = templates.filter(t => t.name !== currentName);
    const newMeal = alternatives[Math.floor(Math.random() * alternatives.length)] || templates[0];

    db.prepare(`
      UPDATE meal_plans SET name = ?, description = ?, calories = ?, protein = ?,
        carbs = ?, fat = ?, prep_time = ?, tags = ?, image = ?, health_score = ?,
        is_cooked = 0, is_favorite = 0
      WHERE id = ?
    `).run(
      newMeal.name, newMeal.desc, newMeal.calories, newMeal.protein,
      newMeal.carbs, newMeal.fat, newMeal.prepTime, JSON.stringify(newMeal.tags),
      newMeal.image, newMeal.healthScore, planId
    );

    res.json({
      success: true,
      data: {
        ...plan,
        name: newMeal.name,
        description: newMeal.desc,
        calories: newMeal.calories,
        protein: newMeal.protein,
        carbs: newMeal.carbs,
        fat: newMeal.fat,
        prep_time: newMeal.prepTime,
        tags: newMeal.tags,
        image: newMeal.image,
        health_score: newMeal.healthScore,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// Fridge Items
// ============================================
router.get('/fridge', (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const items = db.prepare(
      'SELECT * FROM fridge_items WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/fridge', (req, res) => {
  try {
    const { userId = 'default-user', name } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing item name' });

    const id = uuidv4();
    db.prepare('INSERT INTO fridge_items (id, user_id, name) VALUES (?, ?, ?)').run(id, userId, name);

    const items = db.prepare(
      'SELECT * FROM fridge_items WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/fridge/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM fridge_items WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper
function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

module.exports = router;
