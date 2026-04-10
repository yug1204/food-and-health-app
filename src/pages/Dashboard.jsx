import { useState, useEffect } from 'react';
import {
  Flame, Droplets, Target, TrendingUp, Plus, ArrowUpRight,
  Clock, Zap, Heart, ChevronRight, MapPin, Star, UtensilsCrossed, Minus,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import ProgressRing from '../components/ProgressRing';
import { foodLogApi, waterApi, userApi } from '../api';
import { nearbyRestaurants } from '../data/mockData';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('calories');
  const [stats, setStats] = useState(null);
  const [meals, setMeals] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [user, setUser] = useState(null);
  const [streak, setStreak] = useState({ current: 0, best: 0 });
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    try {
      const [statsRes, mealsRes, weeklyRes, userRes, streakRes] = await Promise.all([
        foodLogApi.getStats(today),
        foodLogApi.get(today),
        foodLogApi.getWeekly(),
        userApi.get(),
        userApi.getStreak(),
      ]);
      setStats(statsRes.data);
      setMeals(mealsRes.data);
      setWeeklyData(weeklyRes.data);
      setUser(userRes.data);
      setStreak(streakRes.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddWater = async () => {
    try {
      const res = await waterApi.add();
      setStats(prev => ({ ...prev, water: res.data }));
    } catch (err) { console.error(err); }
  };

  const handleRemoveWater = async () => {
    try {
      const res = await waterApi.remove();
      setStats(prev => ({ ...prev, water: res.data }));
    } catch (err) { console.error(err); }
  };

  if (loading || !stats) {
    return (
      <div className="page-content">
        <div className="page-header"><div className="page-header-left"><h1>Loading Dashboard...</h1></div></div>
        <div className="stats-grid">{[1,2,3,4].map(i => <div key={i} className="stat-card"><div className="skeleton" style={{height:80}}/></div>)}</div>
      </div>
    );
  }

  // Build week day status for streak calendar
  const weekDays = [];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const hasData = weeklyData.find(w => w.date === dateStr);
    weekDays.push({
      short: dayNames[d.getDay()],
      date: d.getDate(),
      status: dateStr === today ? 'today' : (hasData && hasData.calories > 0 ? 'completed' : 'missed'),
    });
  }

  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="page-content">
      <div className="page-header animate-in">
        <div className="page-header-left">
          <h1>{greeting}, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
          <p>Here's your nutrition summary for today</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid animate-in">
        <div className="stat-card green" id="stat-calories">
          <div className="stat-icon green"><Flame /></div>
          <div className="stat-value">{stats.calories.current}</div>
          <div className="stat-label">of {stats.calories.goal} kcal today</div>
          <div className={`stat-trend ${stats.calories.current > 0 ? 'up' : ''}`}>
            {stats.calories.current > 0 ? <><ArrowUpRight size={14}/>{Math.round(stats.calories.current/stats.calories.goal*100)}% of goal</> : 'Start logging!'}
          </div>
        </div>
        <div className="stat-card orange" id="stat-protein">
          <div className="stat-icon orange"><Target /></div>
          <div className="stat-value">{stats.protein.current}g</div>
          <div className="stat-label">of {stats.protein.goal}g protein</div>
          <div className={`stat-trend ${stats.protein.current > 0 ? 'up' : ''}`}>
            {stats.protein.current > 0 ? <><ArrowUpRight size={14}/>{Math.round(stats.protein.current/stats.protein.goal*100)}% hit</> : 'No protein yet'}
          </div>
        </div>
        <div className="stat-card violet" id="stat-streak">
          <div className="stat-icon violet"><Zap /></div>
          <div className="stat-value">{streak.current}</div>
          <div className="stat-label">Day streak 🔥</div>
          <div className="stat-trend up">{streak.current >= streak.best && streak.current > 0 ? 'Personal best!' : `Best: ${streak.best}`}</div>
        </div>
        <div className="stat-card blue" id="stat-water">
          <div className="stat-icon blue"><Droplets /></div>
          <div className="stat-value">{stats.water.current}/{stats.water.goal}</div>
          <div className="stat-label">Glasses of water</div>
          <div className={`stat-trend ${stats.water.current > 0 ? 'up' : ''}`}>
            {stats.water.current >= stats.water.goal ? '✅ Goal hit!' : `${stats.water.goal - stats.water.current} more to go`}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid-2-1" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card animate-in" id="card-calorie-progress">
          <div className="card-header">
            <div className="card-title"><Flame size={18} style={{ color: 'var(--primary-500)' }} /> Today's Progress</div>
            <span className="card-subtitle">{Math.max(0, stats.calories.goal - stats.calories.current)} kcal remaining</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)', padding: 'var(--space-md) 0' }}>
            <ProgressRing value={stats.calories.current} max={stats.calories.goal} size={140} strokeWidth={12} color="var(--primary-500)" label="KCAL" />
            <div style={{ flex: 1 }}>
              {[
                { label: 'Protein', current: stats.protein.current, goal: stats.protein.goal, color: '#3b82f6', unit: 'g' },
                { label: 'Carbs', current: stats.carbs.current, goal: stats.carbs.goal, color: '#f59e0b', unit: 'g' },
                { label: 'Fat', current: stats.fat.current, goal: stats.fat.goal, color: '#ef4444', unit: 'g' },
                { label: 'Fiber', current: stats.fiber.current, goal: stats.fiber.goal, color: '#22c55e', unit: 'g' },
              ].map(m => (
                <div key={m.label} style={{ marginBottom: 14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:'0.78rem' }}>
                    <span style={{ fontWeight:600, color:'var(--neutral-700)' }}>{m.label}</span>
                    <span style={{ color:'var(--neutral-400)' }}>{m.current}/{m.goal}{m.unit}</span>
                  </div>
                  <div className="progress-bar"><div className="progress-bar-fill" style={{ width:`${Math.min(m.current/m.goal*100,100)}%`, background:`linear-gradient(90deg,${m.color},${m.color}dd)` }}/></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card animate-in" id="card-water-tracker">
          <div className="card-header"><div className="card-title"><Droplets size={18} style={{ color:'var(--info)' }}/> Hydration</div></div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'var(--space-md) 0', gap:'var(--space-md)' }}>
            <div className="water-progress">
              <div className="water-fill" style={{ height:`${Math.min((stats.water.current/stats.water.goal)*100,100)}%` }}/>
              <div className="water-text">{stats.water.current}/{stats.water.goal}</div>
            </div>
            <p style={{ fontSize:'0.85rem', color:'var(--neutral-500)', textAlign:'center' }}>
              {stats.water.current >= stats.water.goal ? '🎉 Goal reached!' : `${stats.water.goal - stats.water.current} more glasses to go`}
            </p>
            <div style={{ display:'flex', gap:'var(--space-sm)' }}>
              <button className="btn btn-secondary btn-sm" onClick={handleRemoveWater} disabled={stats.water.current === 0}><Minus size={14}/></button>
              <button className="btn btn-primary btn-sm" onClick={handleAddWater} id="btn-add-water"><Droplets size={14}/> Add Glass</button>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Chart & Today's Meals */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card animate-in" id="card-weekly-chart">
          <div className="card-header">
            <div className="card-title"><TrendingUp size={18} style={{ color:'var(--primary-500)' }}/> Weekly Overview</div>
            <div className="tabs" style={{ marginBottom:0 }}>
              <button className={`tab ${activeTab==='calories'?'active':''}`} onClick={()=>setActiveTab('calories')}>Calories</button>
              <button className={`tab ${activeTab==='macros'?'active':''}`} onClick={()=>setActiveTab('macros')}>Macros</button>
            </div>
          </div>
          <div className="chart-container">
            {activeTab === 'calories' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs><linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1db954" stopOpacity={0.2}/><stop offset="95%" stopColor="#1db954" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="day" tick={{fontSize:12,fill:'#a3a3a3'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:12,fill:'#a3a3a3'}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{ background:'white', border:'1px solid #e5e5e5', borderRadius:12, fontSize:13 }}/>
                  <Area type="monotone" dataKey="goal" stroke="#d4d4d4" strokeDasharray="4 4" fill="none" strokeWidth={2}/>
                  <Area type="monotone" dataKey="calories" stroke="#1db954" fill="url(#colorCal)" strokeWidth={2.5} dot={{r:4,fill:'#1db954',strokeWidth:2,stroke:'white'}}/>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="day" tick={{fontSize:12,fill:'#a3a3a3'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:12,fill:'#a3a3a3'}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{ background:'white', border:'1px solid #e5e5e5', borderRadius:12, fontSize:13 }}/>
                  <Bar dataKey="protein" fill="#3b82f6" radius={[4,4,0,0]}/>
                  <Bar dataKey="carbs" fill="#f59e0b" radius={[4,4,0,0]}/>
                  <Bar dataKey="fat" fill="#ef4444" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card animate-in" id="card-todays-meals">
          <div className="card-header">
            <div className="card-title"><UtensilsCrossed size={18} style={{ color:'var(--accent-500)' }}/> Today's Meals</div>
            <span className="badge badge-green">{meals.length} logged</span>
          </div>
          {meals.length > 0 ? meals.map(meal => (
            <div className="food-item" key={meal.id}>
              <div className="food-item-emoji">{meal.emoji || '🍽️'}</div>
              <div className="food-item-info">
                <div className="food-item-name">{meal.name}</div>
                <div className="food-item-meta"><Clock size={12}/>{meal.time}<span>·</span><span className="badge badge-green" style={{padding:'1px 6px',fontSize:'0.65rem'}}>{meal.meal_type}</span></div>
              </div>
              <div className="food-item-calories">{Math.round(meal.calories)} kcal</div>
            </div>
          )) : (
            <div className="empty-state" style={{ padding:'var(--space-xl)' }}>
              <div className="empty-state-icon">🍽️</div>
              <h3>No meals logged yet</h3>
              <p>Scan food or log a meal to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Week Streak & Nearby */}
      <div className="grid-2">
        <div className="card animate-in" id="card-week-streak">
          <div className="card-header">
            <div className="card-title"><Heart size={18} style={{ color:'var(--error)' }}/> This Week</div>
            <span className="badge badge-orange">🔥 {streak.current} day streak</span>
          </div>
          <div className="week-view" style={{ padding:'var(--space-md) 0' }}>
            {weekDays.map(day => (
              <div className="day-col" key={day.short+day.date}>
                <div className="day-label">{day.short}</div>
                <div className={`day-circle ${day.status}`}>{day.status === 'completed' ? '✓' : day.date}</div>
              </div>
            ))}
          </div>
          {streak.current > 0 && (
            <div className="streak-display" style={{ marginTop:'var(--space-sm)' }}>
              <div className="streak-fire">🔥</div>
              <div className="streak-info"><h3>{streak.current} Days</h3><p>Keep going! You're building great habits.</p></div>
            </div>
          )}
        </div>

        <div className="card animate-in" id="card-nearby">
          <div className="card-header">
            <div className="card-title"><MapPin size={18} style={{ color:'var(--secondary-500)' }}/> Nearby Healthy Spots</div>
          </div>
          {nearbyRestaurants.map((r, i) => (
            <div className="food-item" key={i} style={{ cursor:'pointer' }}>
              <div className="food-item-emoji" style={{ background:'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(29,185,84,0.1))', fontSize:'1.2rem' }}>🏪</div>
              <div className="food-item-info">
                <div className="food-item-name">{r.name}</div>
                <div className="food-item-meta"><MapPin size={12}/>{r.distance}<span>·</span><Star size={12} style={{color:'#f59e0b'}}/>{r.rating}</div>
              </div>
              <span className="badge badge-green">{r.healthyOptions} options</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
