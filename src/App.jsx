import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import FoodScanner from './pages/FoodScanner';
import FoodLog from './pages/FoodLog';
import MealPlanner from './pages/MealPlanner';
import Insights from './pages/Insights';
import Achievements from './pages/Achievements';
import Profile from './pages/Profile';

function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scan" element={<FoodScanner />} />
          <Route path="/log" element={<FoodLog />} />
          <Route path="/plan" element={<MealPlanner />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
