import { useState, useEffect } from 'react';
import { Trophy, Lock, TrendingUp } from 'lucide-react';
import { achievementsApi, userApi } from '../api';
import ProgressRing from '../components/ProgressRing';

export default function Achievements() {
  const [achievementData, setAchievementData] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [streak, setStreak] = useState({ current: 0, best: 0 });
  const [healthScore, setHealthScore] = useState(50);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        // First trigger a full achievement check
        await achievementsApi.check();

        const [achRes, chalRes, streakRes, userRes] = await Promise.all([
          achievementsApi.get(),
          achievementsApi.challenges(),
          userApi.getStreak(),
          userApi.get(),
        ]);
        setAchievementData(achRes.data);
        setChallenges(chalRes.data);
        setStreak(streakRes.data);
        setHealthScore(userRes.data.healthScore || 50);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    loadAll();
  }, []);

  if (loading || !achievementData) return <div className="page-content"><h1>Loading Achievements...</h1></div>;

  const { achievements, stats } = achievementData;
  const filtered = filter === 'all' ? achievements
    : filter === 'unlocked' ? achievements.filter(a => a.unlocked)
    : achievements.filter(a => !a.unlocked);

  const levelEmoji = stats.level === 'Platinum' ? '💎' : stats.level === 'Gold' ? '🥇' : stats.level === 'Silver' ? '🥈' : '🥉';

  return (
    <div className="page-content">
      <div className="page-header animate-in">
        <div className="page-header-left">
          <h1>Achievements 🏆</h1>
          <p>Earn badges, build streaks, and level up your healthy eating journey</p>
        </div>
      </div>

      {/* Top Section */}
      <div className="grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card animate-in" id="streak-card">
          <div className="streak-display" style={{ flexDirection: 'column', textAlign: 'center' }}>
            <div className="streak-fire">🔥</div>
            <div className="streak-info" style={{ textAlign: 'center' }}>
              <h3>{streak.current} Day Streak</h3>
              <p>Best streak: {streak.best} days</p>
            </div>
          </div>
        </div>

        <div className="card animate-in" id="level-card">
          <div style={{ textAlign: 'center', padding: 'var(--space-md) 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)' }}>{levelEmoji}</div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 4 }}>{stats.level} Level</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', marginBottom: 'var(--space-md)' }}>
              {stats.totalUnlocked}/{stats.total} achievements unlocked
            </p>
            <div className="progress-bar" style={{ height: 10 }}>
              <div className="progress-bar-fill" style={{ width: `${stats.progress}%`, background: 'linear-gradient(90deg, var(--accent-400), var(--accent-600))' }} />
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--neutral-400)', marginTop: 6 }}>
              {stats.total - stats.totalUnlocked} more to reach next level
            </p>
          </div>
        </div>

        <div className="card animate-in" id="health-score-card">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-md) 0' }}>
            <ProgressRing value={healthScore} max={100} size={110} strokeWidth={10} color="var(--primary-500)" label="HEALTH" showPercentage={false} />
            <div style={{ marginTop: 'var(--space-md)', textAlign: 'center' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: 4 }}>Health Score</h4>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <TrendingUp size={14} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>Live from your data</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Challenges */}
      <div className="card animate-in" style={{ marginBottom: 'var(--space-xl)' }} id="weekly-challenges">
        <div className="card-header">
          <div className="card-title">⭐ Weekly Challenges</div>
          <span className="badge badge-orange">{challenges.filter(c => c.done).length}/{challenges.length} completed</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {challenges.map((ch, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md)',
              borderRadius: 'var(--border-radius-md)', background: ch.done ? 'rgba(34,197,94,0.04)' : 'var(--neutral-50)',
              border: `1px solid ${ch.done ? 'rgba(34,197,94,0.12)' : 'var(--border-color)'}`,
            }}>
              <div style={{ fontSize: '2rem', flexShrink: 0 }}>{ch.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ch.name}{ch.done && ' ✅'}</span>
                  <span className="badge badge-violet" style={{ fontSize: '0.65rem' }}>{ch.reward}</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--neutral-500)', marginBottom: 6 }}>{ch.desc}</p>
                <div className="progress-bar" style={{ height: 6 }}>
                  <div className="progress-bar-fill" style={{
                    width: `${ch.progress}%`,
                    background: ch.done ? 'linear-gradient(90deg,var(--success),#4ade80)' : 'linear-gradient(90deg,var(--info),#60a5fa)',
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Filters */}
      <div className="tabs animate-in" id="achievement-filters">
        {[
          { key: 'all', label: `All (${stats.total})` },
          { key: 'unlocked', label: `Unlocked (${stats.totalUnlocked})` },
          { key: 'locked', label: `Locked (${stats.total - stats.totalUnlocked})` },
        ].map(f => (
          <button key={f.key} className={`tab ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      {/* Achievement Grid */}
      <div className="achievement-grid" id="achievements-grid">
        {filtered.map(a => (
          <div className={`achievement-item ${a.unlocked ? 'unlocked' : 'locked'} animate-in`} key={a.key} id={`achievement-${a.key}`}>
            <div className="achievement-icon">{a.icon}</div>
            <div className="achievement-name">{a.name}</div>
            <div className="achievement-desc">{a.desc}</div>
            {!a.unlocked && <Lock size={14} style={{ color: 'var(--neutral-400)', marginTop: 'var(--space-sm)' }} />}
            {a.unlocked && a.unlockedAt && (
              <div style={{ fontSize: '0.65rem', color: 'var(--success)', marginTop: 'var(--space-xs)' }}>
                ✅ {new Date(a.unlockedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
