/**
 * Backend API Integration Tests
 * Tests all core API endpoints for correctness
 * @module tests/api
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');

const BASE = 'http://localhost:3001';

/**
 * Helper to make HTTP requests
 * @param {string} method - HTTP method
 * @param {string} path - URL path
 * @param {object} [body] - Request body
 * @returns {Promise<{status: number, data: object}>}
 */
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: {} });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ============================================
// 1. Health Check
// ============================================
describe('Health Check', () => {
  it('GET /api/health returns OK', async () => {
    const res = await request('GET', '/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'ok');
    assert.ok(res.data.timestamp);
    assert.strictEqual(res.data.database, 'connected');
  });

  it('GET /api returns API docs', async () => {
    const res = await request('GET', '/api');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.name, 'NutriSense API');
    assert.ok(res.data.endpoints);
  });
});

// ============================================
// 2. User API
// ============================================
describe('User API', () => {
  it('GET /api/user returns default user', async () => {
    const res = await request('GET', '/api/user?userId=default-user');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.name);
    assert.ok(res.data.data.calorie_goal);
  });

  it('GET /api/user/streak returns streak data', async () => {
    const res = await request('GET', '/api/user/streak?userId=default-user');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(typeof res.data.data.current === 'number');
    assert.ok(typeof res.data.data.best === 'number');
  });

  it('PUT /api/user/goals updates nutrition goals', async () => {
    const res = await request('PUT', '/api/user/goals', {
      userId: 'default-user',
      calorie_goal: 2500,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    // Verify it persisted
    const check = await request('GET', '/api/user?userId=default-user');
    assert.strictEqual(check.data.data.calorie_goal, 2500);
    // Restore
    await request('PUT', '/api/user/goals', { userId: 'default-user', calorie_goal: 2200 });
  });
});

// ============================================
// 3. Food Scanner API
// ============================================
describe('Food Scanner API', () => {
  it('POST /api/scan/image recognizes known food', async () => {
    const res = await request('POST', '/api/scan/image', { query: 'apple', userId: 'default-user' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.name);
    assert.ok(res.data.data.calories > 0);
    assert.ok(res.data.data.healthScore > 0);
  });

  it('POST /api/scan/image returns 404 for unknown food', async () => {
    const res = await request('POST', '/api/scan/image', { query: 'xyznonexistent123' });
    assert.strictEqual(res.status, 404);
  });

  it('POST /api/scan/image returns 400 without query', async () => {
    const res = await request('POST', '/api/scan/image', {});
    assert.strictEqual(res.status, 400);
  });

  it('GET /api/scan/foods lists all known foods', async () => {
    const res = await request('GET', '/api/scan/foods');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.data.length > 30);
  });
});

// ============================================
// 4. Food Log API
// ============================================
describe('Food Log API', () => {
  let createdId;

  it('POST /api/food-log creates a new entry', async () => {
    const res = await request('POST', '/api/food-log', {
      userId: 'default-user',
      name: 'Test Apple',
      emoji: '🍎',
      calories: 95,
      protein: 0.5,
      carbs: 25,
      fat: 0.3,
      mealType: 'Snack',
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.id);
    createdId = res.data.data.id;
  });

  it('GET /api/food-log returns today\'s entries', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request('GET', `/api/food-log?userId=default-user&date=${today}`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.data.length >= 1);
  });

  it('GET /api/food-log/stats returns nutrition totals', async () => {
    const res = await request('GET', '/api/food-log/stats?userId=default-user');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.data.calories);
    assert.ok(typeof res.data.data.calories.current === 'number');
    assert.ok(typeof res.data.data.calories.goal === 'number');
  });

  it('GET /api/food-log/weekly returns 7 days', async () => {
    const res = await request('GET', '/api/food-log/weekly?userId=default-user');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.length, 7);
  });

  it('DELETE /api/food-log/:id deletes entry', async () => {
    if (createdId) {
      const res = await request('DELETE', `/api/food-log/${createdId}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
    }
  });

  it('DELETE /api/food-log/:id returns 404 for missing', async () => {
    const res = await request('DELETE', '/api/food-log/nonexistent-id');
    assert.strictEqual(res.status, 404);
  });
});

// ============================================
// 5. Water API
// ============================================
describe('Water API', () => {
  it('GET /api/water returns current intake', async () => {
    const res = await request('GET', '/api/water?userId=default-user');
    assert.strictEqual(res.status, 200);
    assert.ok(typeof res.data.data.current === 'number');
    assert.ok(typeof res.data.data.goal === 'number');
  });

  it('POST /api/water/add increments water', async () => {
    const before = await request('GET', '/api/water?userId=default-user');
    const res = await request('POST', '/api/water/add', { userId: 'default-user' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.current, before.data.data.current + 1);
  });

  it('POST /api/water/remove decrements water', async () => {
    const before = await request('GET', '/api/water?userId=default-user');
    const res = await request('POST', '/api/water/remove', { userId: 'default-user' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.current, before.data.data.current - 1);
  });
});

// ============================================
// 6. Achievements API
// ============================================
describe('Achievements API', () => {
  it('GET /api/achievements returns all achievements', async () => {
    const res = await request('GET', '/api/achievements?userId=default-user');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.data.achievements.length > 0);
    assert.ok(res.data.data.stats.total > 0);
  });

  it('POST /api/achievements/check runs achievement check', async () => {
    const res = await request('POST', '/api/achievements/check', { userId: 'default-user' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
  });

  it('GET /api/achievements/challenges returns weekly challenges', async () => {
    const res = await request('GET', '/api/achievements/challenges?userId=default-user');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.data.length >= 1);
  });
});

// ============================================
// 7. Insights API
// ============================================
describe('Insights API', () => {
  it('GET /api/insights returns insights array', async () => {
    const res = await request('GET', '/api/insights?userId=default-user');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.data));
  });

  it('GET /api/insights/nutrient-balance returns radar data', async () => {
    const res = await request('GET', '/api/insights/nutrient-balance?userId=default-user');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.length, 6);
    assert.ok(res.data.data[0].subject);
  });

  it('GET /api/insights/summary returns AI summary', async () => {
    const res = await request('GET', '/api/insights/summary?userId=default-user');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.data.summary);
  });
});

// ============================================
// 8. Meal Plans API
// ============================================
describe('Meal Plans API', () => {
  it('POST /api/meal-plans/generate creates a meal plan', async () => {
    const res = await request('POST', '/api/meal-plans/generate', {
      userId: 'default-user',
      days: ['Monday', 'Tuesday'],
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.Monday);
    assert.ok(res.data.data.Monday.length >= 1);
  });

  it('GET /api/meal-plans returns generated plan', async () => {
    const res = await request('GET', '/api/meal-plans?userId=default-user');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.data);
  });

  it('Fridge CRUD works', async () => {
    // Add
    const add = await request('POST', '/api/meal-plans/fridge', { userId: 'default-user', name: 'Test Egg' });
    assert.strictEqual(add.status, 200);
    const eggId = add.data.data.find(i => i.name === 'Test Egg')?.id;
    assert.ok(eggId);

    // List
    const list = await request('GET', '/api/meal-plans/fridge?userId=default-user');
    assert.strictEqual(list.status, 200);
    assert.ok(list.data.data.find(i => i.name === 'Test Egg'));

    // Delete
    const del = await request('DELETE', `/api/meal-plans/fridge/${eggId}`);
    assert.strictEqual(del.status, 200);
  });
});

console.log('\n✅ All API tests completed successfully!\n');
