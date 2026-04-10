/**
 * Food Scanner Routes
 * POST /api/scan/image     — Recognize food from image/text
 * GET  /api/scan/barcode/:barcode — Barcode lookup
 * POST /api/scan/save       — Save scan to history
 * GET  /api/scan/history     — Get scan history
 * POST /api/recommendations/alternatives — Get healthier alternatives
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db.cjs');
const {
  recognizeFood,
  lookupBarcode,
  buildScanResult,
  getAlternatives,
  NUTRITION_DB,
} = require('../services/nutritionService.cjs');

// ============================================
// POST /api/scan/image — Food Recognition
// ============================================
router.post('/image', async (req, res) => {
  try {
    const { query, userId } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Missing "query" field. Provide a food name or description.',
      });
    }

    // Get user allergies for context
    let userAllergies = [];
    if (userId) {
      const user = db.prepare('SELECT allergies FROM users WHERE id = ?').get(userId);
      if (user) {
        userAllergies = JSON.parse(user.allergies || '[]');
      }
    }

    // Recognize food
    const foodData = recognizeFood(query);

    if (!foodData) {
      return res.status(404).json({
        error: 'Food not recognized',
        message: `Could not identify "${query}". Try a different description or use barcode scanning.`,
        suggestions: Object.keys(NUTRITION_DB).slice(0, 10),
      });
    }

    // Build full result
    const result = buildScanResult(query.toLowerCase().trim(), foodData, userAllergies);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('Scan image error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// ============================================
// GET /api/scan/barcode/:barcode — Barcode Lookup
// ============================================
router.get('/barcode/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;

    if (!barcode || barcode.length < 4) {
      return res.status(400).json({ error: 'Invalid barcode' });
    }

    const result = await lookupBarcode(barcode);

    if (!result) {
      return res.status(404).json({
        error: 'Product not found',
        message: `No product found for barcode ${barcode}. Try scanning again or enter food manually.`,
      });
    }

    // Generate alternatives based on the result
    const alternatives = [];
    const healthySwaps = ['greek salad', 'quinoa', 'yogurt', 'nuts', 'apple'];
    for (const key of healthySwaps) {
      const alt = NUTRITION_DB[key];
      if (alt && alt.healthScore > (result.healthScore || 50)) {
        alternatives.push({
          name: alt.name,
          emoji: alt.emoji,
          calories: alt.calories,
          protein: alt.protein,
          healthScore: alt.healthScore,
        });
      }
      if (alternatives.length >= 3) break;
    }

    result.alternatives = alternatives;

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('Barcode scan error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// ============================================
// POST /api/scan/save — Save Scan to History + Food Log
// ============================================
router.post('/save', (req, res) => {
  try {
    const {
      userId = 'default-user',
      foodName,
      scanType = 'image',
      barcode = '',
      confidence = 0.9,
      calories = 0,
      protein = 0,
      carbs = 0,
      fat = 0,
      fiber = 0,
      sugar = 0,
      ingredients = [],
      allergens = [],
      additives = [],
      healthScore = 75,
      alternatives = [],
      vitamins = {},
      benefits = [],
      warnings = [],
      emoji = '🍽️',
      mealType = 'Snack',
      mood = '',
      location = '',
    } = req.body;

    if (!foodName) {
      return res.status(400).json({ error: 'Missing foodName' });
    }

    const scanId = uuidv4();
    const foodLogId = uuidv4();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const dateStr = now.toISOString().split('T')[0];

    // Save to scan history
    db.prepare(`
      INSERT INTO scan_history (id, user_id, food_name, scan_type, barcode, confidence,
        calories, protein, carbs, fat, fiber, sugar, ingredients, allergens, additives,
        health_score, alternatives, vitamins, benefits, warnings, context_mood, context_location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      scanId, userId, foodName, scanType, barcode, confidence,
      calories, protein, carbs, fat, fiber, sugar,
      JSON.stringify(ingredients), JSON.stringify(allergens), JSON.stringify(additives),
      healthScore, JSON.stringify(alternatives), JSON.stringify(vitamins),
      JSON.stringify(benefits), JSON.stringify(warnings), mood, location
    );

    // Also add to food log
    db.prepare(`
      INSERT INTO food_logs (id, user_id, name, emoji, calories, protein, carbs, fat, fiber, sugar,
        meal_type, mood, health_score, time, date, context_location, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      foodLogId, userId, foodName, emoji, calories, protein, carbs, fat, fiber, sugar,
      mealType, mood, healthScore, timeStr, dateStr, location, 'scan'
    );

    // Check achievements
    checkScanAchievements(userId);

    res.json({
      success: true,
      message: 'Food scan saved and added to daily log',
      scanId,
      foodLogId,
    });
  } catch (err) {
    console.error('Save scan error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// ============================================
// GET /api/scan/history — Get scan history
// ============================================
router.get('/history', (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const limit = parseInt(req.query.limit) || 20;

    const history = db.prepare(`
      SELECT * FROM scan_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit);

    const parsed = history.map(h => ({
      ...h,
      ingredients: JSON.parse(h.ingredients || '[]'),
      allergens: JSON.parse(h.allergens || '[]'),
      additives: JSON.parse(h.additives || '[]'),
      alternatives: JSON.parse(h.alternatives || '[]'),
      vitamins: JSON.parse(h.vitamins || '{}'),
      benefits: JSON.parse(h.benefits || '[]'),
      warnings: JSON.parse(h.warnings || '[]'),
    }));

    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('Scan history error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// POST /api/recommendations/alternatives
// ============================================
router.post('/alternatives', (req, res) => {
  try {
    const { foodName, calories, protein, carbs, fat, healthScore, category, userId } = req.body;

    let userAllergies = [];
    if (userId) {
      const user = db.prepare('SELECT allergies FROM users WHERE id = ?').get(userId);
      if (user) userAllergies = JSON.parse(user.allergies || '[]');
    }

    const foodData = {
      name: foodName,
      calories: calories || 0,
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0,
      healthScore: healthScore || 50,
      category: category || 'prepared',
    };

    const alternatives = getAlternatives(foodData, userAllergies);

    res.json({ success: true, data: alternatives });
  } catch (err) {
    console.error('Alternatives error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// GET /api/scan/foods — List all known foods
// ============================================
router.get('/foods', (req, res) => {
  const foods = Object.entries(NUTRITION_DB).map(([key, data]) => ({
    key,
    name: data.name,
    emoji: data.emoji,
    calories: data.calories,
    category: data.category,
    healthScore: data.healthScore,
  }));
  res.json({ success: true, data: foods });
});

// ============================================
// Achievement checker for scans
// ============================================
function checkScanAchievements(userId) {
  const scanCount = db.prepare(
    'SELECT COUNT(*) as count FROM scan_history WHERE user_id = ?'
  ).get(userId).count;

  if (scanCount >= 1) {
    try {
      db.prepare(
        'INSERT OR IGNORE INTO achievements (id, user_id, achievement_key) VALUES (?, ?, ?)'
      ).run(uuidv4(), userId, 'first_scan');
    } catch (e) { /* already unlocked */ }
  }

  if (scanCount >= 50) {
    try {
      db.prepare(
        'INSERT OR IGNORE INTO achievements (id, user_id, achievement_key) VALUES (?, ?, ?)'
      ).run(uuidv4(), userId, 'scanner_pro');
    } catch (e) {}
  }
}

module.exports = router;
