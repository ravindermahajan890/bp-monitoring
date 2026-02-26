import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import ReadingsPage from './pages/ReadingsPage';
import TrendsPage from './pages/TrendsPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <div className="navbar-brand">
          🩺 <span>BP Monitor</span>
        </div>
        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
            📋 Readings
          </NavLink>
          <NavLink to="/trends" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
            📈 Trends &amp; Insights
          </NavLink>
        </div>
      </nav>

      <div className="app">
        <main>
          <Routes>
            <Route path="/" element={<ReadingsPage />} />
            <Route path="/trends" element={<TrendsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

