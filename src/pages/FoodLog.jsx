import { useState, useEffect } from 'react';
import { Search, Plus, Clock, Smile, Trash2, X, Filter } from 'lucide-react';
import { foodLogApi } from '../api';

export default function FoodLog() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [byType, setByType] = useState({});
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', fiber: '', mealType: 'Lunch', emoji: '🍽️' });

  const today = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    try {
      const [logsRes, statsRes, typeRes] = await Promise.all([
        foodLogApi.get(today),
        foodLogApi.getStats(today),
        foodLogApi.getByType(today),
      ]);
      setLogs(logsRes.data);
      setStats(statsRes.data);
      setByType(typeRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    try {
      await foodLogApi.add({
        name: form.name,
        emoji: form.emoji,
        calories: parseFloat(form.calories) || 0,
        protein: parseFloat(form.protein) || 0,
        carbs: parseFloat(form.carbs) || 0,
        fat: parseFloat(form.fat) || 0,
        fiber: parseFloat(form.fiber) || 0,
        mealType: form.mealType,
        mood: selectedMood,
      });
      setShowAddModal(false);
      setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', fiber: '', mealType: 'Lunch', emoji: '🍽️' });
      setSelectedMood('');
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await foodLogApi.delete(id);
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleMoodUpdate = async (id, mood) => {
    try {
      await foodLogApi.update(id, { mood });
      loadData();
    } catch (err) { console.error(err); }
  };

  const filteredLogs = logs.filter(l => {
    const matchesFilter = filter === 'All' || l.meal_type === filter;
    const matchesSearch = !searchTerm || l.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const moods = [
    { emoji: '😊', label: 'Happy', key: 'happy' },
    { emoji: '😌', label: 'Relaxed', key: 'relaxed' },
    { emoji: '⚡', label: 'Energized', key: 'energized' },
    { emoji: '😰', label: 'Stressed', key: 'stressed' },
    { emoji: '😴', label: 'Tired', key: 'tired' },
    { emoji: '😤', label: 'Frustrated', key: 'frustrated' },
  ];

  const emojiOptions = ['🍽️', '🥗', '🍔', '🍕', '🍣', '🥪', '🍲', '🥤', '🍎', '🥚', '🍗', '🐟', '🥦', '☕', '🍰'];

  if (loading) return <div className="page-content"><h1>Loading Food Log...</h1></div>;

  return (
    <div className="page-content">
      <div className="page-header animate-in">
        <div className="page-header-left">
          <h1>Food Log 📝</h1>
          <p>Track everything you eat with mood & context</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} id="btn-add-food">
            <Plus size={18} /> Add Food
          </button>
        </div>
      </div>

      <div className="grid-2-1" style={{ marginBottom: 'var(--space-xl)' }}>
        {/* Left — Food List */}
        <div>
          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
              <input className="input" placeholder="Search meals..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: 36 }} />
            </div>
          </div>

          <div className="tabs animate-in" style={{ marginBottom: 'var(--space-md)' }}>
            {['All', 'Breakfast', 'Lunch', 'Snack', 'Dinner'].map(f => (
              <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>

          {/* Food Items */}
          <div className="card animate-in">
            {filteredLogs.length > 0 ? filteredLogs.map(log => (
              <div className="food-item" key={log.id} id={`log-${log.id}`}>
                <div className="food-item-emoji">{log.emoji || '🍽️'}</div>
                <div className="food-item-info">
                  <div className="food-item-name">{log.name}</div>
                  <div className="food-item-meta">
                    <Clock size={12} /> {log.time}
                    <span>·</span>
                    <span className="badge badge-green" style={{ padding: '1px 6px', fontSize: '0.65rem' }}>{log.meal_type}</span>
                    {log.mood && <><span>·</span>{moods.find(m => m.key === log.mood)?.emoji || ''} {log.mood}</>}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--neutral-400)', marginTop: 2 }}>
                    P:{Math.round(log.protein)}g · C:{Math.round(log.carbs)}g · F:{Math.round(log.fat)}g
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <div className="food-item-calories">{Math.round(log.calories)} kcal</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(log.id)} style={{ color: 'var(--error)', padding: 4 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
                <div className="empty-state-icon">📝</div>
                <h3>No meals logged yet</h3>
                <p>Click "Add Food" or scan something to start tracking</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column — Summary */}
        <div>
          {/* Macro Summary */}
          <div className="card animate-in" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="card-header">
              <div className="card-title">📊 Daily Summary</div>
            </div>
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)', textAlign: 'center', padding: 'var(--space-sm) 0' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: 600 }}>●</div>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>Protein</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#3b82f6' }}>{stats.protein.current}g</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 600 }}>●</div>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>Carbs</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f59e0b' }}>{stats.carbs.current}g</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 600 }}>●</div>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>Fat</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ef4444' }}>{stats.fat.current}g</div>
                </div>
              </div>
            )}
          </div>

          {/* Mood Tracker */}
          <div className="card animate-in" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="card-header">
              <div className="card-title"><Smile size={18} style={{ color: 'var(--accent-500)' }} /> Mood Today</div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', marginBottom: 'var(--space-md)' }}>How are you feeling right now?</p>
            <div className="mood-grid">
              {moods.map(m => (
                <button key={m.key} className={`mood-btn ${selectedMood === m.key ? 'active' : ''}`}
                  onClick={() => setSelectedMood(prev => prev === m.key ? '' : m.key)}>
                  <span style={{ fontSize: '1.5rem' }}>{m.emoji}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* By Meal Type */}
          <div className="card animate-in">
            <div className="card-header">
              <div className="card-title">🕐 By Meal Type</div>
            </div>
            {Object.entries(byType).map(([type, cals]) => (
              <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--neutral-100)' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{type}</span>
                <span style={{ fontWeight: 700, color: 'var(--neutral-700)' }}>{cals} kcal</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Food Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Food</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd} className="modal-body">
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <label className="label">Emoji</label>
                <div className="chip-group">
                  {emojiOptions.map(e => (
                    <button type="button" key={e} className={`chip ${form.emoji === e ? 'selected' : ''}`} onClick={() => setForm(f => ({ ...f, emoji: e }))}>{e}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <label className="label">Food Name *</label>
                <input className="input" placeholder="e.g., Grilled Chicken Salad" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                <div><label className="label">Calories</label><input className="input" type="number" placeholder="0" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} /></div>
                <div><label className="label">Protein (g)</label><input className="input" type="number" placeholder="0" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} /></div>
                <div><label className="label">Carbs (g)</label><input className="input" type="number" placeholder="0" value={form.carbs} onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} /></div>
                <div><label className="label">Fat (g)</label><input className="input" type="number" placeholder="0" value={form.fat} onChange={e => setForm(f => ({ ...f, fat: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <label className="label">Meal Type</label>
                <div className="chip-group">
                  {['Breakfast', 'Lunch', 'Snack', 'Dinner'].map(t => (
                    <button type="button" key={t} className={`chip ${form.mealType === t ? 'selected' : ''}`} onClick={() => setForm(f => ({ ...f, mealType: t }))}>{t}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <label className="label">Mood</label>
                <div className="chip-group">
                  {moods.map(m => (
                    <button type="button" key={m.key} className={`chip ${selectedMood === m.key ? 'selected' : ''}`} onClick={() => setSelectedMood(p => p === m.key ? '' : m.key)}>
                      {m.emoji} {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Plus size={18} /> Add to Food Log
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
