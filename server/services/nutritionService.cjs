/**
 * Nutrition Service — integrates with Open Food Facts API
 * and provides a comprehensive nutrition database for food recognition.
 */
const fetch = require('node-fetch');

// ============================================
// Built-in Nutrition Database (USDA-style)
// ============================================
const NUTRITION_DB = {
  // Fruits
  'apple': { name: 'Apple (Medium)', emoji: '🍎', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, sugar: 19, healthScore: 88, category: 'fruit', vitamins: { 'Vitamin C': '14%', 'Vitamin A': '2%', 'Potassium': '6%' }, benefits: ['Rich in antioxidants', 'Good source of fiber', 'Supports heart health'] },
  'banana': { name: 'Banana (Medium)', emoji: '🍌', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1, sugar: 14, healthScore: 85, category: 'fruit', vitamins: { 'Vitamin B6': '25%', 'Vitamin C': '17%', 'Potassium': '12%' }, benefits: ['Quick energy source', 'Rich in potassium', 'Good for digestion'] },
  'orange': { name: 'Orange (Medium)', emoji: '🍊', calories: 62, protein: 1.2, carbs: 15, fat: 0.2, fiber: 3.1, sugar: 12, healthScore: 90, category: 'fruit', vitamins: { 'Vitamin C': '116%', 'Vitamin A': '4%', 'Calcium': '5%' }, benefits: ['Excellent vitamin C source', 'Boosts immunity', 'Contains antioxidants'] },
  'strawberry': { name: 'Strawberries (1 cup)', emoji: '🍓', calories: 49, protein: 1, carbs: 12, fat: 0.5, fiber: 3, sugar: 7, healthScore: 92, category: 'fruit', vitamins: { 'Vitamin C': '149%', 'Manganese': '29%', 'Folate': '9%' }, benefits: ['Very high in vitamin C', 'Anti-inflammatory', 'Low calorie snack'] },
  'grapes': { name: 'Grapes (1 cup)', emoji: '🍇', calories: 104, protein: 1.1, carbs: 27, fat: 0.2, fiber: 1.4, sugar: 23, healthScore: 72, category: 'fruit', vitamins: { 'Vitamin C': '27%', 'Vitamin K': '28%' }, benefits: ['Contains resveratrol', 'Good for heart health'] },
  'mango': { name: 'Mango (1 cup)', emoji: '🥭', calories: 99, protein: 1.4, carbs: 25, fat: 0.6, fiber: 2.6, sugar: 23, healthScore: 80, category: 'fruit', vitamins: { 'Vitamin C': '67%', 'Vitamin A': '10%', 'Folate': '18%' }, benefits: ['Rich in vitamins', 'Contains digestive enzymes'] },
  'watermelon': { name: 'Watermelon (1 cup)', emoji: '🍉', calories: 46, protein: 0.9, carbs: 12, fat: 0.2, fiber: 0.6, sugar: 9, healthScore: 78, category: 'fruit', vitamins: { 'Vitamin C': '21%', 'Vitamin A': '18%' }, benefits: ['Very hydrating', 'Contains lycopene'] },

  // Vegetables
  'broccoli': { name: 'Broccoli (1 cup)', emoji: '🥦', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, fiber: 5.1, sugar: 2, healthScore: 96, category: 'vegetable', vitamins: { 'Vitamin C': '135%', 'Vitamin K': '116%', 'Folate': '14%' }, benefits: ['Superfood', 'Cancer-fighting compounds', 'Excellent fiber source'] },
  'carrot': { name: 'Carrot (Medium)', emoji: '🥕', calories: 25, protein: 0.6, carbs: 6, fat: 0.1, fiber: 1.7, sugar: 3, healthScore: 90, category: 'vegetable', vitamins: { 'Vitamin A': '203%', 'Vitamin K': '9%', 'Potassium': '4%' }, benefits: ['Excellent for eye health', 'Rich in beta-carotene'] },
  'spinach': { name: 'Spinach (1 cup)', emoji: '🥬', calories: 7, protein: 0.9, carbs: 1.1, fat: 0.1, fiber: 0.7, sugar: 0.1, healthScore: 97, category: 'vegetable', vitamins: { 'Vitamin K': '181%', 'Vitamin A': '56%', 'Iron': '5%' }, benefits: ['Extremely nutrient-dense', 'Rich in iron', 'Anti-inflammatory'] },
  'tomato': { name: 'Tomato (Medium)', emoji: '🍅', calories: 22, protein: 1.1, carbs: 4.8, fat: 0.2, fiber: 1.5, sugar: 3.2, healthScore: 88, category: 'vegetable', vitamins: { 'Vitamin C': '28%', 'Vitamin A': '20%', 'Potassium': '7%' }, benefits: ['Rich in lycopene', 'Heart-healthy', 'Low calorie'] },

  // Proteins
  'chicken breast': { name: 'Grilled Chicken Breast (6oz)', emoji: '🍗', calories: 284, protein: 53, carbs: 0, fat: 6, fiber: 0, sugar: 0, healthScore: 90, category: 'protein', vitamins: { 'Vitamin B6': '30%', 'Niacin': '67%', 'Phosphorus': '25%' }, benefits: ['Excellent protein source', 'Low fat', 'Versatile cooking ingredient'] },
  'salmon': { name: 'Atlantic Salmon (6oz)', emoji: '🐟', calories: 350, protein: 38, carbs: 0, fat: 22, fiber: 0, sugar: 0, healthScore: 92, category: 'protein', vitamins: { 'Vitamin D': '128%', 'Vitamin B12': '212%', 'Omega-3': 'High' }, benefits: ['Rich in omega-3 fatty acids', 'Excellent for brain health', 'High quality protein'] },
  'egg': { name: 'Egg (Large, Whole)', emoji: '🥚', calories: 72, protein: 6, carbs: 0.4, fat: 5, fiber: 0, sugar: 0.2, healthScore: 85, category: 'protein', vitamins: { 'Vitamin B12': '15%', 'Vitamin D': '6%', 'Selenium': '22%' }, benefits: ['Complete protein', 'Contains choline for brain health', 'Versatile ingredient'] },
  'tofu': { name: 'Tofu (1/2 cup)', emoji: '🧊', calories: 94, protein: 10, carbs: 2, fat: 6, fiber: 1, sugar: 0.5, healthScore: 82, category: 'protein', vitamins: { 'Calcium': '20%', 'Iron': '15%', 'Manganese': '31%' }, benefits: ['Plant-based protein', 'Low calorie', 'Good calcium source'] },

  // Grains & Carbs
  'rice': { name: 'White Rice (1 cup cooked)', emoji: '🍚', calories: 206, protein: 4.3, carbs: 45, fat: 0.4, fiber: 0.6, sugar: 0, healthScore: 60, category: 'grain', vitamins: { 'Thiamin': '17%', 'Niacin': '12%', 'Iron': '11%' }, benefits: ['Quick energy source', 'Easy to digest', 'Gluten-free'] },
  'brown rice': { name: 'Brown Rice (1 cup cooked)', emoji: '🍚', calories: 216, protein: 5, carbs: 45, fat: 1.8, fiber: 3.5, sugar: 0.7, healthScore: 78, category: 'grain', vitamins: { 'Manganese': '88%', 'Selenium': '27%', 'Magnesium': '21%' }, benefits: ['Whole grain', 'Rich in fiber', 'More nutritious than white rice'] },
  'pasta': { name: 'Pasta (1 cup cooked)', emoji: '🍝', calories: 220, protein: 8, carbs: 43, fat: 1.3, fiber: 2.5, sugar: 0.8, healthScore: 58, category: 'grain', vitamins: { 'Thiamin': '26%', 'Folate': '26%', 'Iron': '10%' }, benefits: ['Good energy source', 'Contains B vitamins'] },
  'bread': { name: 'Bread (1 slice)', emoji: '🍞', calories: 79, protein: 2.7, carbs: 15, fat: 1, fiber: 0.6, sugar: 1.5, healthScore: 50, category: 'grain', vitamins: { 'Thiamin': '9%', 'Folate': '8%', 'Selenium': '8%' }, benefits: ['Quick energy', 'Enriched with vitamins'] },
  'oats': { name: 'Oatmeal (1 cup cooked)', emoji: '🥣', calories: 166, protein: 6, carbs: 28, fat: 3.6, fiber: 4, sugar: 1, healthScore: 88, category: 'grain', vitamins: { 'Manganese': '63%', 'Phosphorus': '18%', 'Magnesium': '15%' }, benefits: ['Heart-healthy', 'Lowers cholesterol', 'High in fiber'] },
  'quinoa': { name: 'Quinoa (1 cup cooked)', emoji: '🥣', calories: 222, protein: 8, carbs: 39, fat: 3.6, fiber: 5.2, sugar: 1.6, healthScore: 90, category: 'grain', vitamins: { 'Manganese': '58%', 'Magnesium': '30%', 'Phosphorus': '28%' }, benefits: ['Complete plant protein', 'Gluten-free', 'Rich in minerals'] },

  // Fast Food / Prepared
  'burger': { name: 'Classic Beef Burger', emoji: '🍔', calories: 540, protein: 28, carbs: 42, fat: 29, fiber: 2, sugar: 8, healthScore: 42, category: 'fast_food', vitamins: { 'Iron': '22%', 'Vitamin B12': '45%', 'Zinc': '38%' }, benefits: ['High in protein', 'Good iron source'], warnings: ['High in saturated fat', 'Contains processed ingredients'] },
  'pizza': { name: 'Pizza Slice (Pepperoni)', emoji: '🍕', calories: 298, protein: 12, carbs: 34, fat: 13, fiber: 2, sugar: 4, healthScore: 38, category: 'fast_food', vitamins: { 'Calcium': '15%', 'Iron': '8%' }, benefits: ['Contains calcium from cheese'], warnings: ['High in sodium', 'Processed meat', 'Refined flour'] },
  'fries': { name: 'French Fries (Medium)', emoji: '🍟', calories: 365, protein: 4, carbs: 48, fat: 17, fiber: 4, sugar: 0.3, healthScore: 30, category: 'fast_food', vitamins: { 'Vitamin C': '12%', 'Potassium': '15%' }, benefits: ['Source of potassium'], warnings: ['High in trans fat', 'Deep fried', 'High calorie density'] },
  'hot dog': { name: 'Hot Dog with Bun', emoji: '🌭', calories: 290, protein: 11, carbs: 24, fat: 17, fiber: 1, sugar: 4, healthScore: 32, category: 'fast_food', vitamins: { 'Vitamin B12': '15%', 'Iron': '10%' }, benefits: ['Quick protein source'], warnings: ['Highly processed', 'High in sodium nitrates', 'Contains preservatives'] },
  'taco': { name: 'Beef Taco', emoji: '🌮', calories: 210, protein: 10, carbs: 15, fat: 12, fiber: 2, sugar: 1, healthScore: 55, category: 'fast_food', vitamins: { 'Iron': '10%', 'Calcium': '8%' }, benefits: ['Moderate portion size', 'Contains vegetables'] },
  'sandwich': { name: 'Turkey Sandwich', emoji: '🥪', calories: 350, protein: 22, carbs: 35, fat: 12, fiber: 3, sugar: 5, healthScore: 68, category: 'prepared', vitamins: { 'Vitamin B6': '15%', 'Niacin': '20%' }, benefits: ['Good protein source', 'Can include vegetables'] },

  // Salads
  'salad': { name: 'Caesar Salad', emoji: '🥗', calories: 360, protein: 18, carbs: 22, fat: 24, fiber: 5, sugar: 3, healthScore: 72, category: 'salad', vitamins: { 'Vitamin A': '85%', 'Vitamin K': '120%', 'Vitamin C': '45%' }, benefits: ['Rich in vitamins', 'Good fiber source', 'Contains healthy fats from olive oil'] },
  'greek salad': { name: 'Greek Salad', emoji: '🥗', calories: 280, protein: 8, carbs: 14, fat: 22, fiber: 4, sugar: 6, healthScore: 85, category: 'salad', vitamins: { 'Vitamin A': '45%', 'Vitamin C': '30%', 'Calcium': '15%' }, benefits: ['Mediterranean diet staple', 'Heart-healthy fats', 'Rich in antioxidants'] },

  // Drinks
  'smoothie': { name: 'Green Smoothie', emoji: '🥤', calories: 260, protein: 8, carbs: 42, fat: 6, fiber: 5, sugar: 28, healthScore: 75, category: 'drink', vitamins: { 'Vitamin C': '90%', 'Vitamin A': '45%', 'Iron': '12%' }, benefits: ['Packed with vitamins', 'Easy nutrient absorption', 'Hydrating'] },
  'coffee': { name: 'Coffee (with milk)', emoji: '☕', calories: 35, protein: 1.5, carbs: 4, fat: 1.5, fiber: 0, sugar: 3, healthScore: 70, category: 'drink', vitamins: {}, benefits: ['Contains antioxidants', 'Boosts alertness', 'May improve metabolism'] },
  'juice': { name: 'Orange Juice (1 cup)', emoji: '🧃', calories: 112, protein: 1.7, carbs: 26, fat: 0.5, fiber: 0.5, sugar: 21, healthScore: 55, category: 'drink', vitamins: { 'Vitamin C': '124%', 'Folate': '19%', 'Potassium': '14%' }, benefits: ['High in vitamin C'], warnings: ['High sugar content', 'Low fiber compared to whole fruit'] },

  // Desserts & Snacks
  'ice cream': { name: 'Ice Cream (1/2 cup)', emoji: '🍦', calories: 137, protein: 2.3, carbs: 16, fat: 7, fiber: 0.5, sugar: 14, healthScore: 28, category: 'dessert', vitamins: { 'Calcium': '8%', 'Vitamin A': '5%' }, benefits: ['Source of calcium'], warnings: ['High in sugar', 'High in saturated fat'] },
  'chocolate': { name: 'Dark Chocolate (1oz)', emoji: '🍫', calories: 170, protein: 2, carbs: 13, fat: 12, fiber: 3, sugar: 7, healthScore: 55, category: 'dessert', vitamins: { 'Iron': '19%', 'Magnesium': '16%', 'Copper': '25%' }, benefits: ['Rich in antioxidants', 'Contains minerals', 'May improve heart health'] },
  'cookie': { name: 'Chocolate Chip Cookie', emoji: '🍪', calories: 220, protein: 2, carbs: 30, fat: 11, fiber: 1, sugar: 18, healthScore: 25, category: 'dessert', vitamins: {}, benefits: [], warnings: ['High in sugar', 'Refined flour', 'Contains trans fats'] },
  'cake': { name: 'Cake Slice', emoji: '🍰', calories: 350, protein: 4, carbs: 50, fat: 15, fiber: 1, sugar: 35, healthScore: 20, category: 'dessert', vitamins: {}, benefits: [], warnings: ['Very high in sugar', 'High calorie density', 'Low nutritional value'] },
  'donut': { name: 'Glazed Donut', emoji: '🍩', calories: 253, protein: 3, carbs: 31, fat: 14, fiber: 1, sugar: 13, healthScore: 22, category: 'dessert', vitamins: {}, benefits: [], warnings: ['Deep fried', 'High in sugar', 'Refined carbs'] },
  'nuts': { name: 'Mixed Nuts (1oz)', emoji: '🥜', calories: 172, protein: 5, carbs: 7, fat: 15, fiber: 2, sugar: 1.5, healthScore: 82, category: 'snack', vitamins: { 'Vitamin E': '21%', 'Magnesium': '16%', 'Phosphorus': '10%' }, benefits: ['Heart-healthy fats', 'Good protein source', 'Rich in minerals'] },

  // Dairy
  'yogurt': { name: 'Greek Yogurt (1 cup)', emoji: '🥛', calories: 146, protein: 20, carbs: 8, fat: 4, fiber: 0, sugar: 7, healthScore: 86, category: 'dairy', vitamins: { 'Calcium': '18%', 'Vitamin B12': '21%', 'Phosphorus': '22%' }, benefits: ['Excellent protein source', 'Probiotics for gut health', 'Rich in calcium'] },
  'milk': { name: 'Milk (1 cup)', emoji: '🥛', calories: 149, protein: 8, carbs: 12, fat: 8, fiber: 0, sugar: 12, healthScore: 72, category: 'dairy', vitamins: { 'Calcium': '28%', 'Vitamin D': '24%', 'Vitamin B12': '18%' }, benefits: ['Strong bones', 'Good protein source'] },
  'cheese': { name: 'Cheddar Cheese (1oz)', emoji: '🧀', calories: 113, protein: 7, carbs: 0.4, fat: 9, fiber: 0, sugar: 0.1, healthScore: 55, category: 'dairy', vitamins: { 'Calcium': '20%', 'Vitamin A': '6%', 'Phosphorus': '14%' }, benefits: ['Rich in calcium', 'Good protein source'], warnings: ['High in saturated fat', 'High in sodium'] },

  // Bowls & Meals
  'poke bowl': { name: 'Tuna Poke Bowl', emoji: '🍱', calories: 520, protein: 35, carbs: 55, fat: 15, fiber: 4, sugar: 8, healthScore: 82, category: 'bowl', vitamins: { 'Omega-3': 'High', 'Vitamin D': '15%', 'Selenium': '45%' }, benefits: ['Rich in omega-3', 'High protein', 'Fresh ingredients'] },
  'burrito': { name: 'Chicken Burrito', emoji: '🌯', calories: 680, protein: 35, carbs: 72, fat: 25, fiber: 8, sugar: 4, healthScore: 55, category: 'prepared', vitamins: { 'Iron': '25%', 'Vitamin C': '15%', 'Calcium': '20%' }, benefits: ['High protein', 'Contains beans for fiber'], warnings: ['Large portion size', 'High calorie'] },
  'sushi': { name: 'Sushi Roll (6 pcs)', emoji: '🍣', calories: 350, protein: 15, carbs: 52, fat: 8, fiber: 3, sugar: 8, healthScore: 72, category: 'prepared', vitamins: { 'Omega-3': 'Moderate', 'Iodine': 'High', 'Vitamin B12': '20%' }, benefits: ['Contains fish omega-3', 'Moderate calories', 'Well-balanced'] },
  'steak': { name: 'Ribeye Steak (8oz)', emoji: '🥩', calories: 544, protein: 48, carbs: 0, fat: 38, fiber: 0, sugar: 0, healthScore: 50, category: 'protein', vitamins: { 'Iron': '30%', 'Vitamin B12': '180%', 'Zinc': '55%' }, benefits: ['Very high in protein', 'Excellent B12 source', 'Rich in iron and zinc'], warnings: ['High in saturated fat', 'High calorie'] },
  'soup': { name: 'Vegetable Soup (1 bowl)', emoji: '🍲', calories: 120, protein: 4, carbs: 18, fat: 3, fiber: 4, sugar: 6, healthScore: 85, category: 'prepared', vitamins: { 'Vitamin A': '60%', 'Vitamin C': '20%', 'Potassium': '12%' }, benefits: ['Low calorie', 'Rich in vegetables', 'Hydrating'] },
  'curry': { name: 'Chicken Curry', emoji: '🍛', calories: 430, protein: 28, carbs: 15, fat: 30, fiber: 3, sugar: 4, healthScore: 62, category: 'prepared', vitamins: { 'Vitamin A': '12%', 'Vitamin C': '8%', 'Iron': '15%' }, benefits: ['Contains anti-inflammatory spices', 'Good protein'], warnings: ['Can be high in cream/fat'] },
};

// Category-based alternatives mapping
const CATEGORY_ALTERNATIVES = {
  fruit: ['apple', 'banana', 'orange', 'strawberry', 'mango'],
  vegetable: ['broccoli', 'carrot', 'spinach', 'tomato'],
  protein: ['chicken breast', 'salmon', 'tofu', 'egg'],
  grain: ['quinoa', 'brown rice', 'oats'],
  fast_food: ['sandwich', 'salad', 'taco'],
  salad: ['greek salad', 'salad'],
  dessert: ['nuts', 'yogurt', 'chocolate'],
  drink: ['smoothie', 'coffee'],
  dairy: ['yogurt', 'milk'],
  snack: ['nuts', 'yogurt', 'apple', 'carrot'],
  prepared: ['salad', 'soup', 'poke bowl'],
  bowl: ['salad', 'soup'],
};

// ============================================
// Recognition Service — keyword matching
// ============================================
function recognizeFood(query) {
  const q = query.toLowerCase().trim();

  // Direct match
  if (NUTRITION_DB[q]) {
    return { ...NUTRITION_DB[q], confidence: 0.95 };
  }

  // Partial match
  let bestMatch = null;
  let bestScore = 0;

  for (const [key, data] of Object.entries(NUTRITION_DB)) {
    // Check if query contains the key or key contains the query
    if (q.includes(key) || key.includes(q)) {
      const score = key === q ? 1 : (key.includes(q) ? 0.8 : 0.7);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { ...data, confidence: score };
      }
    }

    // Check name match
    const nameLower = data.name.toLowerCase();
    if (nameLower.includes(q) || q.includes(nameLower.split('(')[0].trim().toLowerCase())) {
      const score = 0.85;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { ...data, confidence: score };
      }
    }
  }

  // Word-based matching
  if (!bestMatch) {
    const queryWords = q.split(/\s+/);
    for (const [key, data] of Object.entries(NUTRITION_DB)) {
      const keyWords = key.split(/\s+/);
      const nameWords = data.name.toLowerCase().split(/\s+/);
      const allWords = [...keyWords, ...nameWords];

      let matchedWords = 0;
      for (const qw of queryWords) {
        if (allWords.some(w => w.includes(qw) || qw.includes(w))) {
          matchedWords++;
        }
      }

      if (matchedWords > 0) {
        const score = (matchedWords / queryWords.length) * 0.75;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { ...data, confidence: score };
        }
      }
    }
  }

  return bestMatch;
}

// ============================================
// Get healthier alternatives
// ============================================
function getAlternatives(foodData, userAllergies = []) {
  const category = foodData.category || 'prepared';
  const alternativeKeys = CATEGORY_ALTERNATIVES[category] || CATEGORY_ALTERNATIVES['prepared'];

  const alternatives = [];
  for (const key of alternativeKeys) {
    const alt = NUTRITION_DB[key];
    if (!alt) continue;
    if (alt.name === foodData.name) continue;
    if (alt.healthScore <= foodData.healthScore - 10) continue;

    // Check allergies
    const altAllergens = getCommonAllergens(key);
    const hasAllergyConflict = userAllergies.some(a =>
      altAllergens.some(al => al.toLowerCase().includes(a.toLowerCase()))
    );
    if (hasAllergyConflict) continue;

    alternatives.push({
      name: alt.name,
      emoji: alt.emoji,
      calories: alt.calories,
      protein: alt.protein,
      healthScore: alt.healthScore,
    });
  }

  // Sort by health score descending, take top 3
  return alternatives
    .sort((a, b) => b.healthScore - a.healthScore)
    .slice(0, 3);
}

// ============================================
// Get common allergens for a food
// ============================================
function getCommonAllergens(foodKey) {
  const allergenMap = {
    'bread': ['Gluten', 'Wheat'],
    'pasta': ['Gluten', 'Wheat'],
    'burger': ['Gluten', 'Dairy'],
    'pizza': ['Gluten', 'Dairy'],
    'cake': ['Gluten', 'Dairy', 'Eggs'],
    'cookie': ['Gluten', 'Dairy', 'Eggs'],
    'donut': ['Gluten', 'Dairy', 'Eggs'],
    'cheese': ['Dairy'],
    'milk': ['Dairy'],
    'yogurt': ['Dairy'],
    'ice cream': ['Dairy'],
    'egg': ['Eggs'],
    'sandwich': ['Gluten'],
    'sushi': ['Soy', 'Fish'],
    'salad': ['Dairy'],
    'nuts': ['Tree Nuts'],
  };
  return allergenMap[foodKey] || [];
}

// ============================================
// Get common additives for a food
// ============================================
function getCommonAdditives(foodKey) {
  const additiveMap = {
    'burger': ['Sodium Nitrate', 'BHT Preservative'],
    'hot dog': ['Sodium Nitrite (E250)', 'Potassium Sorbate (E202)', 'Sodium Phosphate (E339)'],
    'pizza': ['Calcium Propionate (E282)'],
    'fries': ['TBHQ (E319)', 'Dimethylpolysiloxane'],
    'ice cream': ['Carrageenan (E407)', 'Guar Gum (E412)'],
    'cookie': ['Soy Lecithin (E322)', 'TBHQ'],
    'cake': ['Polysorbate 60 (E435)', 'Calcium Sulfate'],
    'donut': ['Monoglycerides (E471)', 'BHT (E321)'],
    'juice': ['Calcium Citrate'],
  };
  return additiveMap[foodKey] || [];
}

// ============================================
// Open Food Facts API — barcode lookup
// ============================================
async function lookupBarcode(barcode) {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      { timeout: 8000 }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;

    const product = data.product;
    const nutriments = product.nutriments || {};

    return {
      name: product.product_name || 'Unknown Product',
      emoji: '📦',
      brand: product.brands || '',
      calories: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0),
      protein: Math.round((nutriments.proteins_100g || nutriments.proteins || 0) * 10) / 10,
      carbs: Math.round((nutriments.carbohydrates_100g || nutriments.carbohydrates || 0) * 10) / 10,
      fat: Math.round((nutriments.fat_100g || nutriments.fat || 0) * 10) / 10,
      fiber: Math.round((nutriments.fiber_100g || nutriments.fiber || 0) * 10) / 10,
      sugar: Math.round((nutriments.sugars_100g || nutriments.sugars || 0) * 10) / 10,
      ingredients: (product.ingredients_text || '').split(',').map(i => i.trim()).filter(Boolean),
      allergens: (product.allergens_tags || []).map(a => a.replace('en:', '').replace(/-/g, ' ')),
      additives: (product.additives_tags || []).map(a => a.replace('en:', '').toUpperCase()),
      healthScore: calculateHealthScore(nutriments),
      image: product.image_url || '',
      nutriscore: product.nutriscore_grade || '',
      servingSize: product.serving_size || '100g',
      category: product.categories || '',
      source: 'openfoodfacts',
      barcode: barcode,
    };
  } catch (err) {
    console.error('Barcode lookup failed:', err.message);
    return null;
  }
}

// ============================================
// Calculate health score from nutriments
// ============================================
function calculateHealthScore(nutriments) {
  let score = 50;

  const protein = nutriments.proteins_100g || 0;
  const fiber = nutriments.fiber_100g || 0;
  const sugar = nutriments.sugars_100g || 0;
  const fat = nutriments.fat_100g || nutriments['saturated-fat_100g'] || 0;
  const sodium = nutriments.sodium_100g || 0;
  const calories = nutriments['energy-kcal_100g'] || 0;

  // Positive factors
  score += Math.min(protein * 2, 20);
  score += Math.min(fiber * 3, 15);

  // Negative factors
  score -= Math.min(sugar * 1.5, 20);
  score -= Math.min(fat * 1, 15);
  score -= Math.min(sodium * 5, 10);
  if (calories > 300) score -= Math.min((calories - 300) * 0.05, 10);

  return Math.max(10, Math.min(100, Math.round(score)));
}

// ============================================
// Build full scan result
// ============================================
function buildScanResult(foodKey, foodData, userAllergies = []) {
  const allergens = getCommonAllergens(foodKey);
  const additives = getCommonAdditives(foodKey);
  const alternatives = getAlternatives(foodData, userAllergies);

  return {
    name: foodData.name,
    emoji: foodData.emoji || '🍽️',
    confidence: foodData.confidence || 0.9,
    calories: foodData.calories,
    protein: foodData.protein,
    carbs: foodData.carbs,
    fat: foodData.fat,
    fiber: foodData.fiber,
    sugar: foodData.sugar,
    healthScore: foodData.healthScore,
    category: foodData.category || '',
    allergens,
    additives,
    alternatives,
    vitamins: foodData.vitamins || {},
    benefits: foodData.benefits || [],
    warnings: foodData.warnings || [],
    source: 'nutrisense_db',
  };
}

module.exports = {
  NUTRITION_DB,
  recognizeFood,
  getAlternatives,
  getCommonAllergens,
  getCommonAdditives,
  lookupBarcode,
  buildScanResult,
  calculateHealthScore,
};
