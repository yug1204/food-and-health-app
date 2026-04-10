import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanLine,
  UtensilsCrossed,
  CalendarDays,
  Brain,
  User,
  Trophy,
  Leaf,
  Settings,
} from 'lucide-react';
import { userData } from '../data/mockData';

const navItems = [
  { label: 'OVERVIEW', items: [] },
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/scan', icon: ScanLine, label: 'Food Scanner' },
  { path: '/log', icon: UtensilsCrossed, label: 'Food Log' },
  { label: 'PLANNING', items: [] },
  { path: '/plan', icon: CalendarDays, label: 'Meal Planner' },
  { path: '/insights', icon: Brain, label: 'AI Insights' },
  { path: '/achievements', icon: Trophy, label: 'Achievements' },
  { label: 'SETTINGS', items: [] },
  { path: '/profile', icon: User, label: 'Profile & Goals' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Leaf />
        </div>
        <span className="sidebar-logo-text">NutriSense</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, idx) => {
          if (item.items !== undefined) {
            return (
              <div className="sidebar-section-label" key={`section-${idx}`}>
                {item.label}
              </div>
            );
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
              id={`nav-${item.path.replace('/', '') || 'dashboard'}`}
            >
              <Icon />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <NavLink
          to="/profile"
          className="sidebar-user"
          id="sidebar-user-profile"
        >
          <div className="sidebar-avatar">{userData.initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{userData.name}</div>
            <div className="sidebar-user-plan">✨ {userData.plan} Plan</div>
          </div>
        </NavLink>
      </div>
    </aside>
  );
}
