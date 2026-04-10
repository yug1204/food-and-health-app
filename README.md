# 🥗 NutriSense — AI-Powered Personalized Nutrition & Healthy Eating Companion

An intelligent food & health tracking app that scans food, analyzes nutrition, detects allergens, suggests healthier alternatives, and provides AI-powered personalized insights.

## 🚀 Features

- **📸 Food Scanner** — Scan food by name or barcode (Open Food Facts API), get instant nutrition breakdown, allergen alerts, and healthier alternatives
- **📝 Food Log** — Track meals with calories, macros, mood, and meal type with full CRUD operations
- **🍽️ AI Meal Planner** — Generate weekly meal plans tailored to your goals, cook meals, swap recipes
- **🧠 AI Insights** — Eating pattern detection, nutrient balance radar, mood-calorie correlation analysis
- **🏆 Achievements** — Gamification with streaks, challenges, XP rewards, and badge system
- **💧 Water Tracker** — Daily hydration tracking with streak detection
- **⚙️ Profile** — Editable nutrition goals, dietary restrictions, allergen management

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 |
| Backend | Node.js + Express 5 |
| Database | SQLite (better-sqlite3) |
| Charts | Recharts |
| Icons | Lucide React |
| External API | Open Food Facts (barcode lookup) |
| Styling | Vanilla CSS (custom design system) |

## 📦 Setup & Run

```bash
# Install dependencies
npm install

# Start backend (port 3001)
npm run server

# Start frontend (port 5173) — in a new terminal
npm run dev
```

Open **http://localhost:5173** in your browser.

## 🌐 Production Build

```bash
npm run build
npm start
```

The Express server serves the built frontend on port 3001.

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scan/image` | POST | Food recognition by name |
| `/api/scan/barcode/:code` | GET | Barcode lookup (Open Food Facts) |
| `/api/scan/save` | POST | Save scan to history & log |
| `/api/food-log` | GET/POST | Food log CRUD |
| `/api/food-log/stats` | GET | Daily nutrition totals |
| `/api/food-log/weekly` | GET | Weekly chart data |
| `/api/water/add` | POST | Add glass of water |
| `/api/meal-plans/generate` | POST | Generate weekly meal plan |
| `/api/insights` | GET | AI behavior insights |
| `/api/achievements` | GET | Achievement status |
| `/api/user` | GET/PUT | User profile |

## 📸 Screenshots

The app features a premium glassmorphism design with:
- Dark gradient sidebar navigation
- Animated progress rings and charts
- Responsive layout with card-based UI
- Micro-animations and hover effects

## 👥 Team

Built for Hack2Skill Hackathon — Food & Health App Challenge
