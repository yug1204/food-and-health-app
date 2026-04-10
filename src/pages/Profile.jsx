import { useState, useEffect } from 'react';
import {
  Heart, Target, Bell, Shield, Palette, Smartphone,
  Scale, Ruler, Calendar, ChevronRight, AlertTriangle, Activity, Save, Loader,
} from 'lucide-react';
import { userApi } from '../api';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [mealReminders, setMealReminders] = useState(true);
  const [waterReminders, setWaterReminders] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [editingGoals, setEditingGoals] = useState(false);
  const [goals, setGoals] = useState({});

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await userApi.get();
        const u = res.data;
        setUser(u);
        setNotifications(!!u.notifications);
        setMealReminders(!!u.meal_reminders);
        setWaterReminders(!!u.water_reminders);
        setDarkMode(!!u.dark_mode);
        setGoals({
          calorie_goal: u.calorie_goal,
          protein_goal: u.protein_goal,
          carbs_goal: u.carbs_goal,
          fat_goal: u.fat_goal,
          fiber_goal: u.fiber_goal,
          water_goal: u.water_goal,
        });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    loadUser();
  }, []);

  const handleSettingChange = async (key, value) => {
    try {
      await userApi.updateSettings({ [key]: value });
    } catch (err) { console.error(err); }
  };

  const handleSaveGoals = async () => {
    setSaving(true);
    try {
      await userApi.updateGoals(goals);
      setEditingGoals(false);
      const res = await userApi.get();
      setUser(res.data);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  if (loading || !user) return <div className="page-content"><h1>Loading Profile...</h1></div>;

  const daysSinceJoin = Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)) || 1;

  return (
    <div className="page-content">
      <div className="page-header animate-in">
        <div className="page-header-left">
          <h1>Profile & Goals ⚙️</h1>
          <p>Manage your health profile, dietary preferences, and app settings</p>
        </div>
      </div>

      {/* Profile Header */}
      <div className="profile-header animate-in" id="profile-header">
        <div className="profile-avatar-large">{user.name?.split(' ').map(n => n[0]).join('') || 'AJ'}</div>
        <div className="profile-info">
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <div className="profile-stats-row">
            <div className="profile-stat"><div className="profile-stat-value">{daysSinceJoin}</div><div className="profile-stat-label">Days Active</div></div>
            <div className="profile-stat"><div className="profile-stat-value">{user.totalMeals || 0}</div><div className="profile-stat-label">Meals Logged</div></div>
            <div className="profile-stat"><div className="profile-stat-value">{user.streak || 0}</div><div className="profile-stat-label">Day Streak</div></div>
            <div className="profile-stat"><div className="profile-stat-value">{user.healthScore || 50}</div><div className="profile-stat-label">Health Score</div></div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 'var(--space-xl)' }}>
        <div>
          {/* Health Profile */}
          <div className="settings-section animate-in" id="health-profile">
            <h3><Heart size={18} style={{ color: 'var(--error)', marginRight: 8, verticalAlign: 'middle' }} />Health Profile</h3>
            {[
              { icon: <Scale size={20} />, label: 'Weight', value: `${user.weight} kg`, desc: 'Target metric' },
              { icon: <Ruler size={20} />, label: 'Height', value: `${user.height} cm`, desc: 'Set profile' },
              { icon: <Calendar size={20} />, label: 'Age', value: `${user.age} years`, desc: 'From profile' },
              { icon: <Target size={20} />, label: 'Goal', value: user.goal, desc: 'Active goal' },
              { icon: <Activity size={20} />, label: 'Activity', value: user.activity_level, desc: 'Current level' },
            ].map((item, idx) => (
              <div className="settings-item" key={idx}>
                <div className="settings-item-left">{item.icon}<div className="settings-item-info"><h4>{item.label}</h4><p>{item.desc}</p></div></div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--neutral-700)' }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Nutrition Goals */}
          <div className="settings-section animate-in" id="nutrition-goals">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3><Target size={18} style={{ color: 'var(--primary-500)', marginRight: 8, verticalAlign: 'middle' }} />Daily Nutrition Goals</h3>
              {!editingGoals ? (
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingGoals(true)}>Edit</button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={handleSaveGoals} disabled={saving}>
                  {saving ? <Loader size={14} className="spin" /> : <Save size={14} />} Save
                </button>
              )}
            </div>
            <div className="card">
              {[
                { key: 'calorie_goal', label: 'Calories', unit: 'kcal', color: 'var(--primary-500)' },
                { key: 'protein_goal', label: 'Protein', unit: 'g', color: '#3b82f6' },
                { key: 'carbs_goal', label: 'Carbs', unit: 'g', color: '#f59e0b' },
                { key: 'fat_goal', label: 'Fat', unit: 'g', color: '#ef4444' },
                { key: 'fiber_goal', label: 'Fiber', unit: 'g', color: '#22c55e' },
                { key: 'water_goal', label: 'Water', unit: 'glasses', color: 'var(--info)' },
              ].map((goal, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: idx < 5 ? '1px solid var(--neutral-100)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: goal.color }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{goal.label}</span>
                  </div>
                  {editingGoals ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        className="input"
                        type="number"
                        value={goals[goal.key] || ''}
                        onChange={e => setGoals(g => ({ ...g, [goal.key]: parseInt(e.target.value) || 0 }))}
                        style={{ width: 80, textAlign: 'right', padding: '4px 8px' }}
                      />
                      <span style={{ fontSize: '0.78rem', color: 'var(--neutral-400)' }}>{goal.unit}</span>
                    </div>
                  ) : (
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--neutral-700)' }}>{goals[goal.key]} {goal.unit}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          {/* Dietary Preferences */}
          <div className="settings-section animate-in" id="dietary-prefs">
            <h3><Shield size={18} style={{ color: 'var(--secondary-500)', marginRight: 8, verticalAlign: 'middle' }} />Dietary Preferences</h3>
            <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: 'var(--space-sm)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Restrictions</p>
                <div className="chip-group">
                  {(user.dietary_restrictions || []).map(r => <span className="chip selected" key={r}>{r}</span>)}
                  <button className="chip" style={{ borderStyle: 'dashed' }}>+ Add</button>
                </div>
              </div>
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: 'var(--space-sm)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Allergies</p>
                <div className="chip-group">
                  {(user.allergies || []).map(a => <span className="badge badge-red" key={a} style={{ fontSize: '0.78rem', padding: '4px 12px' }}><AlertTriangle size={12} />{a}</span>)}
                  <button className="chip" style={{ borderStyle: 'dashed' }}>+ Add</button>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: 'var(--space-sm)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preferences</p>
                <div className="chip-group">
                  {(user.preferences || []).map(p => <span className="chip selected" key={p}>{p}</span>)}
                  <button className="chip" style={{ borderStyle: 'dashed' }}>+ Add</button>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="settings-section animate-in" id="notification-settings">
            <h3><Bell size={18} style={{ color: 'var(--accent-500)', marginRight: 8, verticalAlign: 'middle' }} />Notifications</h3>
            {[
              { label: 'Push Notifications', desc: 'Get notified about insights', key: 'notifications', checked: notifications, onChange: () => { setNotifications(!notifications); handleSettingChange('notifications', !notifications); } },
              { label: 'Meal Reminders', desc: 'Remind to log meals', key: 'meal_reminders', checked: mealReminders, onChange: () => { setMealReminders(!mealReminders); handleSettingChange('meal_reminders', !mealReminders); } },
              { label: 'Water Reminders', desc: 'Hourly hydration nudges', key: 'water_reminders', checked: waterReminders, onChange: () => { setWaterReminders(!waterReminders); handleSettingChange('water_reminders', !waterReminders); } },
            ].map((item, idx) => (
              <div className="settings-item" key={idx}>
                <div className="settings-item-left"><div className="settings-item-info"><h4>{item.label}</h4><p>{item.desc}</p></div></div>
                <label className="toggle">
                  <input type="checkbox" checked={item.checked} onChange={item.onChange} />
                  <span className="toggle-slider" />
                </label>
              </div>
            ))}
          </div>

          {/* App Settings */}
          <div className="settings-section animate-in" id="app-settings">
            <h3><Palette size={18} style={{ color: 'var(--info)', marginRight: 8, verticalAlign: 'middle' }} />App Settings</h3>
            <div className="settings-item">
              <div className="settings-item-left"><div className="settings-item-info"><h4>Dark Mode</h4><p>Switch to dark theme</p></div></div>
              <label className="toggle">
                <input type="checkbox" checked={darkMode} onChange={() => { setDarkMode(!darkMode); handleSettingChange('dark_mode', !darkMode); }} />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="settings-item" style={{ cursor: 'pointer' }}>
              <div className="settings-item-left"><Smartphone size={20} /><div className="settings-item-info"><h4>Connected Devices</h4><p>Sync with fitness trackers</p></div></div>
              <ChevronRight size={18} style={{ color: 'var(--neutral-400)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
