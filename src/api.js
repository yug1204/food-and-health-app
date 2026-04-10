/**
 * NutriSense API Client
 * Centralized API calls to the Express backend
 */
const BASE = '/api';
const USER_ID = 'default-user';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ======== USER ========
export const userApi = {
  get: () => request(`/user?userId=${USER_ID}`),
  update: (fields) => request('/user', { method: 'PUT', body: JSON.stringify({ userId: USER_ID, ...fields }) }),
  updateGoals: (goals) => request('/user/goals', { method: 'PUT', body: JSON.stringify({ userId: USER_ID, ...goals }) }),
  updateSettings: (settings) => request('/user/settings', { method: 'PUT', body: JSON.stringify({ userId: USER_ID, ...settings }) }),
  getStreak: () => request(`/user/streak?userId=${USER_ID}`),
};

// ======== FOOD LOG ========
export const foodLogApi = {
  get: (date, mealType) => {
    let url = `/food-log?userId=${USER_ID}`;
    if (date) url += `&date=${date}`;
    if (mealType) url += `&mealType=${mealType}`;
    return request(url);
  },
  getStats: (date) => request(`/food-log/stats?userId=${USER_ID}${date ? `&date=${date}` : ''}`),
  getWeekly: () => request(`/food-log/weekly?userId=${USER_ID}`),
  getByType: (date) => request(`/food-log/by-type?userId=${USER_ID}${date ? `&date=${date}` : ''}`),
  add: (entry) => request('/food-log', { method: 'POST', body: JSON.stringify({ userId: USER_ID, ...entry }) }),
  update: (id, fields) => request(`/food-log/${id}`, { method: 'PUT', body: JSON.stringify(fields) }),
  delete: (id) => request(`/food-log/${id}`, { method: 'DELETE' }),
};

// ======== SCANNER ========
export const scanApi = {
  image: (query) => request('/scan/image', { method: 'POST', body: JSON.stringify({ query, userId: USER_ID }) }),
  barcode: (code) => request(`/scan/barcode/${code}`),
  save: (data) => request('/scan/save', { method: 'POST', body: JSON.stringify({ userId: USER_ID, ...data }) }),
  history: (limit = 20) => request(`/scan/history?userId=${USER_ID}&limit=${limit}`),
  foods: () => request('/scan/foods'),
  alternatives: (data) => request('/scan/alternatives', { method: 'POST', body: JSON.stringify({ userId: USER_ID, ...data }) }),
};

// ======== WATER ========
export const waterApi = {
  get: (date) => request(`/water?userId=${USER_ID}${date ? `&date=${date}` : ''}`),
  add: () => request('/water/add', { method: 'POST', body: JSON.stringify({ userId: USER_ID }) }),
  remove: () => request('/water/remove', { method: 'POST', body: JSON.stringify({ userId: USER_ID }) }),
  weekly: () => request(`/water/weekly?userId=${USER_ID}`),
};

// ======== ACHIEVEMENTS ========
export const achievementsApi = {
  get: () => request(`/achievements?userId=${USER_ID}`),
  check: () => request('/achievements/check', { method: 'POST', body: JSON.stringify({ userId: USER_ID }) }),
  challenges: () => request(`/achievements/challenges?userId=${USER_ID}`),
};

// ======== INSIGHTS ========
export const insightsApi = {
  get: () => request(`/insights?userId=${USER_ID}`),
  patterns: () => request(`/insights/patterns?userId=${USER_ID}`),
  nutrientBalance: () => request(`/insights/nutrient-balance?userId=${USER_ID}`),
  moodCorrelation: () => request(`/insights/mood-correlation?userId=${USER_ID}`),
  summary: () => request(`/insights/summary?userId=${USER_ID}`),
};

// ======== MEAL PLANS ========
export const mealPlanApi = {
  get: (weekStart) => request(`/meal-plans?userId=${USER_ID}${weekStart ? `&weekStart=${weekStart}` : ''}`),
  generate: (days) => request('/meal-plans/generate', { method: 'POST', body: JSON.stringify({ userId: USER_ID, days }) }),
  cook: (id) => request(`/meal-plans/${id}/cook`, { method: 'PUT' }),
  fav: (id) => request(`/meal-plans/${id}/fav`, { method: 'PUT' }),
  swap: (planId) => request('/meal-plans/swap', { method: 'POST', body: JSON.stringify({ planId, userId: USER_ID }) }),
  getFridge: () => request(`/meal-plans/fridge?userId=${USER_ID}`),
  addFridge: (name) => request('/meal-plans/fridge', { method: 'POST', body: JSON.stringify({ userId: USER_ID, name }) }),
  removeFridge: (id) => request(`/meal-plans/fridge/${id}`, { method: 'DELETE' }),
};
