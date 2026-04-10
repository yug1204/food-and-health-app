/**
 * App — Root application component
 * Implements lazy loading for code-splitting (Efficiency),
 * Error Boundary for resilience (Code Quality),
 * and semantic landmarks for screen readers (Accessibility).
 * @module App
 */
import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy-loaded pages for code-splitting and efficiency
const Dashboard = lazy(() => import('./pages/Dashboard'));
const FoodScanner = lazy(() => import('./pages/FoodScanner'));
const FoodLog = lazy(() => import('./pages/FoodLog'));
const MealPlanner = lazy(() => import('./pages/MealPlanner'));
const Insights = lazy(() => import('./pages/Insights'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Profile = lazy(() => import('./pages/Profile'));

/**
 * Loading fallback component shown while lazy pages load
 * @returns {JSX.Element}
 */
function PageLoader() {
  return (
    <div className="page-content" role="status" aria-label="Loading page">
      <div className="page-header">
        <div className="page-header-left">
          <h1 aria-live="polite">Loading...</h1>
        </div>
      </div>
      <div className="stats-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card" aria-hidden="true">
            <div className="skeleton" style={{ height: 80, borderRadius: 'var(--border-radius-md)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Root application component
 * @returns {JSX.Element}
 */
function App() {
  return (
    <ErrorBoundary>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content" id="main-content" role="main" aria-label="Main content area">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/scan" element={<FoodScanner />} />
              <Route path="/log" element={<FoodLog />} />
              <Route path="/plan" element={<MealPlanner />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
