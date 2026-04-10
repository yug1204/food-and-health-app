import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Moon, Sun, Activity as ActivityIcon, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { insightsApi } from '../api';

export default function Insights() {
  const [insights, setInsights] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [nutrientData, setNutrientData] = useState([]);
  const [moodData, setMoodData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [insRes, patRes, nutRes, moodRes, sumRes] = await Promise.all([
          insightsApi.get(),
          insightsApi.patterns(),
          insightsApi.nutrientBalance(),
          insightsApi.moodCorrelation(),
          insightsApi.summary(),
        ]);
        setInsights(insRes.data);
        setPatterns(patRes.data);
        setNutrientData(nutRes.data);
        setMoodData(moodRes.data);
        setSummary(sumRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    loadAll();
  }, []);

  const filteredInsights = filter === 'all' ? insights : insights.filter(i => i.type === filter);

  const severityIcon = (severity) => {
    switch (severity) {
      case 'positive': return <CheckCircle size={16} style={{ color: 'var(--success)' }} />;
      case 'warning': return <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />;
      case 'important': return <AlertTriangle size={16} style={{ color: 'var(--error)' }} />;
      default: return <Info size={16} style={{ color: 'var(--info)' }} />;
    }
  };

  const tagClass = (color) => `badge badge-${color || 'blue'}`;

  if (loading) return <div className="page-content"><h1>Loading AI Insights...</h1></div>;

  return (
    <div className="page-content">
      <div className="page-header animate-in">
        <div className="page-header-left">
          <h1>AI Insights 🧠</h1>
          <p>AI-powered behavior analysis & personalized recommendations</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
        {/* Nutrient Balance Radar */}
        <div className="card animate-in" id="nutrient-radar">
          <div className="card-header">
            <div className="card-title"><Brain size={18} style={{ color: 'var(--primary-500)' }} /> Nutrient Balance</div>
            <span className="badge badge-green">7-day avg</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={nutrientData}>
                <PolarGrid stroke="var(--neutral-200)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: 'var(--neutral-600)' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--neutral-400)' }} />
                <Radar name="You" dataKey="A" stroke="var(--primary-500)" fill="var(--primary-500)" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mood-Calorie Correlation */}
        <div className="card animate-in" id="mood-chart">
          <div className="card-header">
            <div className="card-title"><TrendingUp size={18} style={{ color: 'var(--accent-500)' }} /> Mood & Calorie Correlation</div>
          </div>
          <div className="chart-container">
            {moodData.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#a3a3a3' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 12, fontSize: 13 }} />
                  <Line yAxisId="left" type="monotone" dataKey="calories" stroke="var(--primary-500)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--primary-500)', strokeWidth: 2, stroke: 'white' }} />
                  <Line yAxisId="right" type="monotone" dataKey="mood" stroke="var(--accent-500)" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: 'var(--accent-500)' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div className="empty-state-icon">📊</div>
                <p style={{ color: 'var(--neutral-400)' }}>Log meals with mood tags to see correlations</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Eating Patterns */}
      <div className="card animate-in" style={{ marginBottom: 'var(--space-xl)' }} id="patterns">
        <div className="card-header">
          <div className="card-title"><ActivityIcon size={18} style={{ color: 'var(--secondary-500)' }} /> Eating Patterns</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
          {patterns.map((p, i) => (
            <div key={i} style={{ padding: 'var(--space-md)', borderRadius: 'var(--border-radius-md)', background: 'var(--neutral-50)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  {p.icon === 'Moon' ? '🌙' : p.icon === 'Sun' ? '☀️' : p.icon === 'Activity' ? '🍿' : '⏰'} {p.label}
                </span>
                <span className={`badge ${p.trend === 'stable' || p.trend === 'improving' ? 'badge-green' : p.trend === 'increasing' ? 'badge-orange' : 'badge-red'}`} style={{ fontSize: '0.65rem' }}>
                  {p.trend}
                </span>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--neutral-500)' }}>{p.frequency}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Summary */}
      {summary && (
        <div className="card animate-in" style={{ marginBottom: 'var(--space-xl)', borderLeft: '4px solid var(--primary-500)' }} id="ai-summary">
          <div className="card-header">
            <div className="card-title"><Brain size={18} style={{ color: 'var(--primary-500)' }} /> AI Weekly Summary</div>
          </div>
          <div style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--neutral-600)' }}>
            {summary.summary.split('\n\n').map((paragraph, i) => (
              <p key={i} style={{ marginBottom: 'var(--space-md)' }}
                dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Insight Cards */}
      <div className="tabs animate-in" style={{ marginBottom: 'var(--space-md)' }}>
        {[
          { key: 'all', label: 'All Insights' },
          { key: 'positive', label: '✅ Positive' },
          { key: 'pattern', label: '🔄 Patterns' },
          { key: 'nutrition', label: '🥗 Nutrition' },
          { key: 'suggestion', label: '💡 Suggestions' },
        ].map(f => (
          <button key={f.key} className={`tab ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
        {filteredInsights.map(insight => (
          <div className="card animate-in" key={insight.id} id={`insight-${insight.id}`}>
            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'start' }}>
              <div style={{ fontSize: '2rem', flexShrink: 0 }}>{insight.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                  <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {severityIcon(insight.severity)} {insight.title}
                  </h3>
                  <span className={tagClass(insight.tagColor)} style={{ fontSize: '0.65rem' }}>{insight.tag}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', lineHeight: 1.5 }}>{insight.description}</p>
              </div>
            </div>
          </div>
        ))}

        {filteredInsights.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)' }}>🔍</div>
            <p style={{ color: 'var(--neutral-400)' }}>No insights in this category yet. Keep logging meals to unlock insights!</p>
          </div>
        )}
      </div>
    </div>
  );
}
