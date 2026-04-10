/**
 * NutriSense Backend Server
 * Express + SQLite powered API
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// Middleware
// ============================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.method !== 'OPTIONS') {
      console.log(`${req.method} ${req.url} — ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// ============================================
// Initialize database
// ============================================
const db = require('./db.cjs');

// ============================================
// Routes
// ============================================
const scanRoutes = require('./routes/scan.cjs');
const foodLogRoutes = require('./routes/foodLog.cjs');
const waterRoutes = require('./routes/water.cjs');
const userRoutes = require('./routes/user.cjs');
const achievementRoutes = require('./routes/achievements.cjs');
const insightRoutes = require('./routes/insights.cjs');
const mealPlanRoutes = require('./routes/mealPlans.cjs');

app.use('/api/scan', scanRoutes);
app.use('/api/food-log', foodLogRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/user', userRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/meal-plans', mealPlanRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected',
  });
});

// API docs
app.get('/api', (req, res) => {
  res.json({
    name: 'NutriSense API',
    version: '1.0.0',
    endpoints: {
      scan: {
        'POST /api/scan/image': 'Recognize food from text/image query',
        'GET /api/scan/barcode/:barcode': 'Barcode lookup via Open Food Facts',
        'POST /api/scan/save': 'Save scan to history & food log',
        'GET /api/scan/history': 'Get scan history',
        'GET /api/scan/foods': 'List all known foods',
        'POST /api/scan/alternatives': 'Get healthier alternatives',
      },
      foodLog: {
        'GET /api/food-log': 'Get food log for a date',
        'POST /api/food-log': 'Add food entry',
        'PUT /api/food-log/:id': 'Update food entry',
        'DELETE /api/food-log/:id': 'Delete food entry',
        'GET /api/food-log/stats': 'Get daily nutrition stats',
        'GET /api/food-log/weekly': 'Get weekly chart data',
        'GET /api/food-log/by-type': 'Breakdown by meal type',
      },
      water: {
        'GET /api/water': 'Get today\'s water intake',
        'POST /api/water/add': 'Add a glass of water',
        'POST /api/water/remove': 'Remove a glass of water',
        'GET /api/water/weekly': 'Weekly water data',
      },
      user: {
        'GET /api/user': 'Get user profile',
        'PUT /api/user': 'Update user profile',
        'PUT /api/user/goals': 'Update nutrition goals',
        'PUT /api/user/settings': 'Update app settings',
        'GET /api/user/streak': 'Get current streak',
      },
      achievements: {
        'GET /api/achievements': 'Get all achievements',
        'POST /api/achievements/check': 'Trigger achievement check',
        'GET /api/achievements/challenges': 'Get weekly challenges',
      },
      insights: {
        'GET /api/insights': 'Get AI insights',
        'GET /api/insights/patterns': 'Get eating patterns',
        'GET /api/insights/nutrient-balance': 'Get nutrient radar data',
        'GET /api/insights/mood-correlation': 'Get mood-calorie data',
        'GET /api/insights/summary': 'Get AI weekly summary',
      },
      mealPlans: {
        'GET /api/meal-plans': 'Get meal plans for a week',
        'POST /api/meal-plans/generate': 'Generate new meal plan',
        'PUT /api/meal-plans/:id/cook': 'Mark as cooked (adds to food log)',
        'PUT /api/meal-plans/:id/fav': 'Toggle favorite',
        'POST /api/meal-plans/swap': 'Swap a meal',
        'GET /api/meal-plans/fridge': 'Get fridge items',
        'POST /api/meal-plans/fridge': 'Add fridge item',
        'DELETE /api/meal-plans/fridge/:id': 'Remove fridge item',
      },
    },
  });
});

// ============================================
// Serve frontend in production
// ============================================
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (!req.url.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

// ============================================
// Error handling
// ============================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ============================================
// Start
// ============================================
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   🥗 NutriSense API Server              ║
║   Running on http://localhost:${PORT}       ║
║   API Docs: http://localhost:${PORT}/api    ║
║   Database: SQLite (nutrisense.db)       ║
╚══════════════════════════════════════════╝
  `);
});

module.exports = app;
