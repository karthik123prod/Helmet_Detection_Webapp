import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Shield, ScanSearch, History, Info, ChevronRight } from 'lucide-react';
import DashboardPage from './pages/DashboardPage';
import DetectionPage from './pages/DetectionPage';
import HistoryPage from './pages/HistoryPage';
import AboutPage from './pages/AboutPage';

function App() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Toast Notification */}
        {toast && (
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
          </div>
        )}

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Shield size={22} />
            </div>
            <span className="sidebar-logo-text">SHIELD AI</span>
          </div>

          <nav className="sidebar-nav">
            <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <ScanSearch size={20} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/detect" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Shield size={20} />
              <span>Detection</span>
              <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.4 }} />
            </NavLink>
            <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <History size={20} />
              <span>History</span>
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Info size={20} />
              <span>About</span>
            </NavLink>
          </nav>

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
              <div className="pulse-dot"></div>
              <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>System Online</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DashboardPage showToast={showToast} />} />
            <Route path="/detect" element={<DetectionPage showToast={showToast} />} />
            <Route path="/history" element={<HistoryPage showToast={showToast} />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
