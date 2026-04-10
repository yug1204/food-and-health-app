const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'nutrisense.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============================================
// Schema Creation
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Alex Johnson',
    email TEXT DEFAULT 'alex@nutrisense.ai',
    age INTEGER DEFAULT 28,
    weight REAL DEFAULT 72,
    height REAL DEFAULT 175,
    goal TEXT DEFAULT 'Maintain & Build Muscle',
    calorie_goal INTEGER DEFAULT 2200,
    protein_goal INTEGER DEFAULT 140,
    carbs_goal INTEGER DEFAULT 250,
    fat_goal INTEGER DEFAULT 70,
    fiber_goal INTEGER DEFAULT 30,
    water_goal INTEGER DEFAULT 8,
    activity_level TEXT DEFAULT 'Moderately Active',
    dietary_restrictions TEXT DEFAULT '[]',
    allergies TEXT DEFAULT '[]',
    preferences TEXT DEFAULT '[]',
    notifications INTEGER DEFAULT 1,
    meal_reminders INTEGER DEFAULT 1,
    water_reminders INTEGER DEFAULT 1,
    dark_mode INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS food_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '🍽️',
    calories REAL DEFAULT 0,
    protein REAL DEFAULT 0,
    carbs REAL DEFAULT 0,
    fat REAL DEFAULT 0,
    fiber REAL DEFAULT 0,
    sugar REAL DEFAULT 0,
    meal_type TEXT DEFAULT 'Snack',
    mood TEXT DEFAULT '',
    health_score INTEGER DEFAULT 75,
    time TEXT DEFAULT '',
    date TEXT DEFAULT (date('now')),
    context_location TEXT DEFAULT '',
    context_activity TEXT DEFAULT '',
    source TEXT DEFAULT 'manual',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS scan_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    food_name TEXT NOT NULL,
    scan_type TEXT DEFAULT 'image',
    barcode TEXT DEFAULT '',
    confidence REAL DEFAULT 0,
    calories REAL DEFAULT 0,
    protein REAL DEFAULT 0,
    carbs REAL DEFAULT 0,
    fat REAL DEFAULT 0,
    fiber REAL DEFAULT 0,
    sugar REAL DEFAULT 0,
    ingredients TEXT DEFAULT '[]',
    allergens TEXT DEFAULT '[]',
    additives TEXT DEFAULT '[]',
    health_score INTEGER DEFAULT 75,
    alternatives TEXT DEFAULT '[]',
    vitamins TEXT DEFAULT '{}',
    benefits TEXT DEFAULT '[]',
    warnings TEXT DEFAULT '[]',
    image_path TEXT DEFAULT '',
    context_mood TEXT DEFAULT '',
    context_location TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS water_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    glasses INTEGER DEFAULT 1,
    date TEXT DEFAULT (date('now')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS meal_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    week_start TEXT NOT NULL,
    day TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    calories REAL DEFAULT 0,
    protein REAL DEFAULT 0,
    carbs REAL DEFAULT 0,
    fat REAL DEFAULT 0,
    prep_time INTEGER DEFAULT 15,
    tags TEXT DEFAULT '[]',
    image TEXT DEFAULT '',
    health_score INTEGER DEFAULT 80,
    is_cooked INTEGER DEFAULT 0,
    is_favorite INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    achievement_key TEXT NOT NULL,
    unlocked_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, achievement_key)
  );

  CREATE TABLE IF NOT EXISTS fridge_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_scan_history_user ON scan_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_meal_plans_user_week ON meal_plans(user_id, week_start);
`);

// ============================================
// Seed default user if none exists
// ============================================
function seedDefaultUser() {
  const existing = db.prepare('SELECT id FROM users LIMIT 1').get();
  if (!existing) {
    const userId = 'default-user';
    db.prepare(`
      INSERT INTO users (id, name, email, age, weight, height, goal, calorie_goal, 
        protein_goal, carbs_goal, fat_goal, fiber_goal, water_goal, activity_level,
        dietary_restrictions, allergies, preferences)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId, 'Alex Johnson', 'alex@nutrisense.ai', 28, 72, 175,
      'Maintain & Build Muscle', 2200, 140, 250, 70, 30, 8,
      'Moderately Active',
      JSON.stringify(['Gluten-Free']),
      JSON.stringify(['Peanuts']),
      JSON.stringify(['Mediterranean', 'High Protein', 'Low Sugar'])
    );
    console.log('✅ Default user seeded');
    return userId;
  }
  return existing.id;
}

seedDefaultUser();

module.exports = db;
