import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import ReadingsPage from './pages/ReadingsPage';
import TrendsPage from './pages/TrendsPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <h1>🩺 Blood Pressure Monitor</h1>
          <p>Track your systolic &amp; diastolic readings over time</p>
          <nav className="app-nav">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              📋 Readings
            </NavLink>
            <NavLink to="/trends" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              📈 Trends &amp; Insights
            </NavLink>
          </nav>
        </header>

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

