import { useState, useEffect } from 'react';
import { Calendar, ChefHat, Clock, Heart, RefreshCw, Sparkles, Plus, X, Trash2, Loader } from 'lucide-react';
import { mealPlanApi } from '../api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function MealPlanner() {
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showFridge, setShowFridge] = useState(false);
  const [fridgeItems, setFridgeItems] = useState([]);
  const [newItem, setNewItem] = useState('');

  const loadPlans = async () => {
    try {
      const res = await mealPlanApi.get();
      setPlans(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadFridge = async () => {
    try {
      const res = await mealPlanApi.getFridge();
      setFridgeItems(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadPlans(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await mealPlanApi.generate(DAYS);
      setPlans(res.data);
    } catch (err) { console.error(err); }
    finally { setGenerating(false); }
  };

  const handleCook = async (id) => {
    try {
      await mealPlanApi.cook(id);
      loadPlans();
    } catch (err) { console.error(err); }
  };

  const handleFav = async (id) => {
    try {
      await mealPlanApi.fav(id);
      loadPlans();
    } catch (err) { console.error(err); }
  };

  const handleSwap = async (id) => {
    try {
      await mealPlanApi.swap(id);
      loadPlans();
    } catch (err) { console.error(err); }
  };

  const handleAddFridgeItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    try {
      const res = await mealPlanApi.addFridge(newItem.trim());
      setFridgeItems(res.data);
      setNewItem('');
    } catch (err) { console.error(err); }
  };

  const handleRemoveFridgeItem = async (id) => {
    try {
      await mealPlanApi.removeFridge(id);
      setFridgeItems(prev => prev.filter(i => i.id !== id));
    } catch (err) { console.error(err); }
  };

  const dayMeals = plans[selectedDay] || [];
  const dailyTotals = dayMeals.reduce((acc, m) => ({
    calories: acc.calories + (m.calories || 0),
    protein: acc.protein + (m.protein || 0),
    prepTime: acc.prepTime + (m.prep_time || m.prepTime || 0),
  }), { calories: 0, protein: 0, prepTime: 0 });

  const hasPlan = Object.values(plans).some(d => d && d.length > 0);

  if (loading) return <div className="page-content"><h1>Loading Meal Planner...</h1></div>;

  return (
    <div className="page-content">
      <div className="page-header animate-in">
        <div className="page-header-left">
          <h1>Meal Planner 🍽️</h1>
          <p>AI-generated meal plans tailored to your goals</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => { setShowFridge(true); loadFridge(); }}>🧊 My Fridge</button>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating} id="btn-generate-plan">
            {generating ? <Loader size={18} className="spin" /> : <Sparkles size={18} />}
            {hasPlan ? 'Regenerate Plan' : 'Generate Plan'}
          </button>
        </div>
      </div>

      {!hasPlan ? (
        <div className="card animate-in" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🍽️</div>
          <h2 style={{ marginBottom: 'var(--space-sm)' }}>No Meal Plan Yet</h2>
          <p style={{ color: 'var(--neutral-500)', marginBottom: 'var(--space-lg)', maxWidth: 400, margin: '0 auto var(--space-lg)' }}>
            Click "Generate Plan" to create an AI-powered weekly meal plan tailored to your nutritional goals and dietary preferences.
          </p>
          <button className="btn btn-primary btn-lg" onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader size={18} className="spin" /> : <Sparkles size={18} />}
            Generate My Meal Plan
          </button>
        </div>
      ) : (
        <>
          {/* Day Selector */}
          <div className="tabs animate-in" style={{ marginBottom: 'var(--space-lg)' }} id="day-selector">
            {DAYS.map(d => (
              <button key={d} className={`tab ${selectedDay === d ? 'active' : ''}`} onClick={() => setSelectedDay(d)}>
                {d.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Daily Summary */}
          <div className="card animate-in" style={{ marginBottom: 'var(--space-xl)' }} id="daily-summary">
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', padding: 'var(--space-sm) 0' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-600)' }}>{Math.round(dailyTotals.calories)}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--neutral-500)' }}>Total kcal</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>{Math.round(dailyTotals.protein)}g</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--neutral-500)' }}>Protein</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-500)' }}>{dailyTotals.prepTime} min</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--neutral-500)' }}>Total prep</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{dayMeals.length}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--neutral-500)' }}>Meals</div>
              </div>
            </div>
          </div>

          {/* Meal Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
            {dayMeals.map(meal => (
              <div className="card animate-in meal-plan-card" key={meal.id} id={`meal-${meal.id}`} style={{ overflow: 'hidden' }}>
                {meal.image && (
                  <div style={{ height: 180, overflow: 'hidden', borderRadius: 'var(--border-radius-lg) var(--border-radius-lg) 0 0', marginTop: '-1.25rem', marginLeft: '-1.25rem', marginRight: '-1.25rem' }}>
                    <img src={meal.image} alt={meal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: 'var(--space-md) 0 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-sm)' }}>
                    <div>
                      <span className="badge badge-green" style={{ marginBottom: 4, display: 'inline-block', fontSize: '0.65rem' }}>
                        {meal.meal_type}
                      </span>
                      <h3 style={{ fontSize: '1.05rem', marginTop: 4 }}>{meal.name}</h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-600)' }}>{meal.calories}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--neutral-400)' }}>kcal</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--neutral-500)', marginBottom: 'var(--space-md)', lineHeight: 1.5 }}>
                    {meal.description || meal.desc}
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)', fontSize: '0.78rem', color: 'var(--neutral-600)' }}>
                    <span>💪 {meal.protein}g protein</span>
                    <span><Clock size={12} /> {meal.prep_time || meal.prepTime} min</span>
                    <span>⭐ {meal.health_score || meal.healthScore}</span>
                  </div>
                  {(meal.tags && (Array.isArray(meal.tags) ? meal.tags : JSON.parse(meal.tags || '[]')).length > 0) && (
                    <div className="chip-group" style={{ marginBottom: 'var(--space-md)' }}>
                      {(Array.isArray(meal.tags) ? meal.tags : JSON.parse(meal.tags || '[]')).map(tag => (
                        <span key={tag} className="chip" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{tag}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button className={`btn ${meal.is_cooked ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => handleCook(meal.id)} style={{ flex: 1 }}>
                      <ChefHat size={14} /> {meal.is_cooked ? 'Cooked ✓' : 'Cook'}
                    </button>
                    <button className={`btn btn-ghost btn-sm`} onClick={() => handleFav(meal.id)} style={{ color: meal.is_favorite ? 'var(--error)' : 'var(--neutral-400)' }}>
                      <Heart size={14} fill={meal.is_favorite ? 'var(--error)' : 'none'} />
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleSwap(meal.id)}>
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Fridge Modal */}
      {showFridge && (
        <div className="modal-overlay" onClick={() => setShowFridge(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🧊 My Fridge</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowFridge(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddFridgeItem} style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <input className="input" placeholder="Add ingredient..." value={newItem} onChange={e => setNewItem(e.target.value)} style={{ flex: 1 }} />
                <button className="btn btn-primary" type="submit"><Plus size={18} /></button>
              </form>
              {fridgeItems.length > 0 ? (
                <div className="chip-group">
                  {fridgeItems.map(item => (
                    <span key={item.id} className="chip selected" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {item.name}
                      <button onClick={() => handleRemoveFridgeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--neutral-400)' }}>No items in your fridge yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
