import { useState } from 'react';
import {
  Camera, Upload, Search, AlertTriangle, CheckCircle, ArrowRight,
  Shield, Sparkles, Heart, Zap, Loader, Save, X,
} from 'lucide-react';
import { scanApi } from '../api';

export default function FoodScanner() {
  const [query, setQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanHistory, setScanHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchMode, setSearchMode] = useState('food'); // 'food' | 'barcode'

  const doScan = async (foodQuery) => {
    setScanning(true);
    setResult(null);
    setError('');
    setSaved(false);
    try {
      // Simulate scan animation delay
      await new Promise(r => setTimeout(r, 1500));
      const res = await scanApi.image(foodQuery);
      setResult(res.data);
    } catch (err) {
      setError(err.message || 'Could not recognize food. Try a different term.');
    } finally {
      setScanning(false);
    }
  };

  const doBarcodeScan = async () => {
    if (!barcodeInput.trim()) return;
    setScanning(true);
    setResult(null);
    setError('');
    setSaved(false);
    try {
      await new Promise(r => setTimeout(r, 1000));
      const res = await scanApi.barcode(barcodeInput.trim());
      setResult(res.data);
    } catch (err) {
      setError(err.message || 'Barcode not found. Try entering the food name manually.');
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async (mealType = 'Snack') => {
    if (!result) return;
    try {
      await scanApi.save({
        foodName: result.name,
        emoji: result.emoji,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        fiber: result.fiber,
        sugar: result.sugar,
        healthScore: result.healthScore,
        allergens: result.allergens,
        additives: result.additives,
        alternatives: result.alternatives,
        vitamins: result.vitamins,
        benefits: result.benefits,
        warnings: result.warnings,
        mealType,
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await scanApi.history(10);
      setScanHistory(res.data);
      setShowHistory(true);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchMode === 'barcode') doBarcodeScan();
    else if (query.trim()) doScan(query.trim());
  };

  const getScoreColor = (score) => score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--error)';
  const getScoreLabel = (score) => score >= 75 ? 'Healthy' : score >= 50 ? 'Moderate' : 'Poor';

  return (
    <div className="page-content">
      <div className="page-header animate-in">
        <div className="page-header-left">
          <h1>Food Scanner 📸</h1>
          <p>Scan any food to get instant nutritional breakdown & smart insights</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={loadHistory}>History</button>
        </div>
      </div>

      {/* Scanner Input */}
      <div className="card animate-in" style={{ marginBottom: 'var(--space-xl)', textAlign: 'center' }} id="scanner-card">
        <div className="scanner-viewport" style={{ marginBottom: 'var(--space-xl)', position: 'relative' }}>
          {scanning ? (
            <div className="scan-overlay">
              <div className="scan-line" />
              <div className="scan-crosshair">
                <Loader size={48} className="spin" style={{ color: 'var(--primary-400)' }} />
              </div>
              <p style={{ color: 'var(--primary-400)', marginTop: 'var(--space-md)', fontSize: '0.9rem' }}>
                Analyzing food...
              </p>
            </div>
          ) : (
            <div className="scan-placeholder">
              <Camera size={48} style={{ color: 'var(--neutral-400)', marginBottom: 'var(--space-md)' }} />
              <p style={{ color: 'var(--neutral-400)' }}>
                {result ? 'Scan complete! See results below.' : 'Type a food name, enter a barcode, or try a demo scan'}
              </p>
              <p style={{ color: 'var(--neutral-500)', fontSize: '0.8rem' }}>
                AI-powered recognition identifies food instantly
              </p>
            </div>
          )}
        </div>

        {/* Search Tabs */}
        <div className="tabs" style={{ justifyContent: 'center', marginBottom: 'var(--space-md)' }}>
          <button className={`tab ${searchMode === 'food' ? 'active' : ''}`} onClick={() => setSearchMode('food')}>🔍 Food Name</button>
          <button className={`tab ${searchMode === 'barcode' ? 'active' : ''}`} onClick={() => setSearchMode('barcode')}>📦 Barcode</button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'var(--space-sm)', maxWidth: 500, margin: '0 auto var(--space-lg)' }}>
          {searchMode === 'food' ? (
            <input
              type="text"
              className="input"
              placeholder="Enter food name (e.g., burger, apple, quinoa...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              id="food-query-input"
            />
          ) : (
            <input
              type="text"
              className="input"
              placeholder="Enter barcode number..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              id="barcode-input"
            />
          )}
          <button className="btn btn-primary" type="submit" disabled={scanning} id="btn-scan">
            {scanning ? <Loader size={18} className="spin" /> : <Search size={18} />}
            Scan
          </button>
        </form>

        {/* Quick Demo Chips */}
        <div style={{ marginBottom: 'var(--space-sm)' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--neutral-400)', marginBottom: 'var(--space-sm)' }}>
            TRY A DEMO SCAN
          </p>
          <div className="chip-group" style={{ justifyContent: 'center' }}>
            {['apple', 'burger', 'salad', 'salmon', 'pizza', 'quinoa', 'yogurt', 'oats'].map(food => (
              <button
                key={food}
                className="chip"
                onClick={() => doScan(food)}
                disabled={scanning}
              >
                {food === 'apple' ? '🍎' : food === 'burger' ? '🍔' : food === 'salad' ? '🥗' : food === 'salmon' ? '🐟' : food === 'pizza' ? '🍕' : food === 'quinoa' ? '🥣' : food === 'yogurt' ? '🥛' : '🥣'} {food.charAt(0).toUpperCase() + food.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card animate-in" style={{ borderLeft: '4px solid var(--error)', marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--error)' }}>
            <AlertTriangle size={20} />
            <div>
              <h4 style={{ marginBottom: 4 }}>Food Not Found</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)' }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Scan Results */}
      {result && (
        <div className="animate-in">
          {/* Header Result Card */}
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }} id="scan-result">
            <div className="card-header">
              <div className="card-title">
                <span style={{ fontSize: '1.5rem' }}>{result.emoji}</span>
                <div>
                  <h2 style={{ fontSize: '1.2rem', marginBottom: 2 }}>{result.name}</h2>
                  <span style={{ fontSize: '0.78rem', color: 'var(--neutral-400)' }}>
                    Confidence: {Math.round((result.confidence || 0.9) * 100)}%
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: getScoreColor(result.healthScore) }}>
                  {result.healthScore}
                </div>
                <div style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: getScoreColor(result.healthScore) + '18', color: getScoreColor(result.healthScore) }}>
                  {getScoreLabel(result.healthScore)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
            {/* Nutrition Breakdown */}
            <div className="card" id="nutrition-breakdown">
              <div className="card-header">
                <div className="card-title"><Zap size={18} style={{ color: 'var(--primary-500)' }} /> Nutrition Breakdown</div>
              </div>
              <div className="macro-grid">
                {[
                  { label: 'Calories', value: result.calories, unit: 'kcal', color: 'var(--primary-500)' },
                  { label: 'Protein', value: result.protein, unit: 'g', color: '#3b82f6' },
                  { label: 'Carbs', value: result.carbs, unit: 'g', color: '#f59e0b' },
                  { label: 'Fat', value: result.fat, unit: 'g', color: '#ef4444' },
                  { label: 'Fiber', value: result.fiber, unit: 'g', color: '#22c55e' },
                  { label: 'Sugar', value: result.sugar, unit: 'g', color: '#8b5cf6' },
                ].map(m => (
                  <div key={m.label} style={{ textAlign: 'center', padding: 'var(--space-md)', borderRadius: 'var(--border-radius-md)', background: m.color + '08', border: `1px solid ${m.color}18` }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--neutral-500)', fontWeight: 500 }}>{m.unit}</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--neutral-700)', marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vitamins & Minerals */}
            {result.vitamins && Object.keys(result.vitamins).length > 0 && (
              <div className="card" id="vitamins-card">
                <div className="card-header">
                  <div className="card-title"><Sparkles size={18} style={{ color: '#f59e0b' }} /> Vitamins & Minerals</div>
                </div>
                {Object.entries(result.vitamins).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--neutral-100)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{key}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-600)' }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
            {/* Allergens & Additives */}
            <div className="card" id="allergens-card">
              <div className="card-header">
                <div className="card-title"><Shield size={18} style={{ color: 'var(--error)' }} /> Allergens & Additives</div>
              </div>
              {result.allergens?.length > 0 && (
                <div style={{ marginBottom: 'var(--space-md)' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: 'var(--space-xs)', textTransform: 'uppercase' }}>Allergens</p>
                  <div className="chip-group">
                    {result.allergens.map(a => <span key={a} className="badge badge-red" style={{ fontSize: '0.78rem' }}><AlertTriangle size={12} /> {a}</span>)}
                  </div>
                </div>
              )}
              {result.additives?.length > 0 && (
                <div style={{ marginBottom: 'var(--space-md)' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: 'var(--space-xs)', textTransform: 'uppercase' }}>Additives</p>
                  <div className="chip-group">
                    {result.additives.map(a => <span key={a} className="badge badge-orange" style={{ fontSize: '0.78rem' }}>{a}</span>)}
                  </div>
                </div>
              )}
              {result.warnings?.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: 'var(--space-xs)', textTransform: 'uppercase' }}>Warnings</p>
                  {result.warnings.map(w => (
                    <div key={w} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--error)', padding: '4px 0' }}>
                      <AlertTriangle size={14} /> {w}
                    </div>
                  ))}
                </div>
              )}
              {(!result.allergens?.length && !result.additives?.length && !result.warnings?.length) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)', padding: 'var(--space-md) 0' }}>
                  <CheckCircle size={20} /> No allergens or harmful additives detected
                </div>
              )}
            </div>

            {/* Benefits */}
            <div className="card" id="benefits-card">
              <div className="card-header">
                <div className="card-title"><Heart size={18} style={{ color: 'var(--success)' }} /> Health Benefits</div>
              </div>
              {result.benefits?.length > 0 ? result.benefits.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i < result.benefits.length - 1 ? '1px solid var(--neutral-100)' : 'none' }}>
                  <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem' }}>{b}</span>
                </div>
              )) : (
                <p style={{ color: 'var(--neutral-400)', fontSize: '0.85rem', padding: 'var(--space-md) 0' }}>No specific health benefits identified.</p>
              )}
            </div>
          </div>

          {/* Healthier Alternatives */}
          {result.alternatives?.length > 0 && (
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }} id="alternatives-card">
              <div className="card-header">
                <div className="card-title"><ArrowRight size={18} style={{ color: 'var(--secondary-500)' }} /> Healthier Alternatives</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                {result.alternatives.map((alt, i) => (
                  <div key={i} style={{ padding: 'var(--space-md)', borderRadius: 'var(--border-radius-md)', background: 'var(--neutral-50)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{alt.emoji || '🥗'}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{alt.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>{alt.calories} kcal · {alt.protein}g protein</div>
                    <div style={{ fontSize: '0.75rem', marginTop: 4, color: 'var(--success)', fontWeight: 600 }}>
                      Score: {alt.healthScore}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="card animate-in" style={{ textAlign: 'center' }} id="save-scan-card">
            {saved ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)', padding: 'var(--space-md)', color: 'var(--success)' }}>
                <CheckCircle size={24} />
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Saved to your food log!</span>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', marginBottom: 'var(--space-md)' }}>Add this food to your daily log</p>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {['Breakfast', 'Lunch', 'Snack', 'Dinner'].map(type => (
                    <button key={type} className="btn btn-secondary btn-sm" onClick={() => handleSave(type)}>
                      <Save size={14} /> Log as {type}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scan History Modal */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Scan History</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowHistory(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              {scanHistory.length > 0 ? scanHistory.map(s => (
                <div className="food-item" key={s.id}>
                  <div className="food-item-emoji">📸</div>
                  <div className="food-item-info">
                    <div className="food-item-name">{s.food_name}</div>
                    <div className="food-item-meta">{s.scan_type} · Score: {s.health_score} · {new Date(s.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="food-item-calories">{Math.round(s.calories)} kcal</div>
                </div>
              )) : (
                <p style={{ textAlign: 'center', color: 'var(--neutral-400)', padding: 'var(--space-xl)' }}>No scans yet. Try scanning a food!</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
