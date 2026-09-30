import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useEffect, useState } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import DocumentUpload from './pages/DocumentUpload';
import DocumentList from './pages/DocumentList';
import SummaryView from './pages/SummaryView';
import CleaningObservatoryView from './pages/CleaningObservatoryView';
import DocComparisonView from './pages/DocComparisonView';
import QualityCenterView from './pages/QualityCenterView';
import CostDashboard from './pages/CostDashboard';
import SettingsView from './pages/SettingsView';
import HistoryView from './pages/HistoryView';
import './App.css';

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    localStorage.getItem('docintel-theme') === 'light' ? 'light' : 'dark'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('docintel-theme', theme);
  }, [theme]);

  return (
    <AuthProvider>
      <Router>
        <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
          <Navbar theme={theme} onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} />
          <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px' }}>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Workspace Routes */}
              <Route path="/" element={<ProtectedRoute><DocumentUpload /></ProtectedRoute>} />
              <Route path="/documents" element={<ProtectedRoute><DocumentList /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><HistoryView /></ProtectedRoute>} />
              <Route path="/pipeline" element={<Navigate to="/" replace />} />
              <Route path="/summary" element={<ProtectedRoute><SummaryView /></ProtectedRoute>} />
              <Route path="/summary/:summaryId" element={<ProtectedRoute><SummaryView /></ProtectedRoute>} />
              <Route path="/qa" element={<Navigate to="/documents" replace />} />
              <Route path="/cleaning" element={<ProtectedRoute><CleaningObservatoryView /></ProtectedRoute>} />
              <Route path="/compare" element={<ProtectedRoute><DocComparisonView /></ProtectedRoute>} />
              <Route path="/quality" element={<ProtectedRoute><QualityCenterView /></ProtectedRoute>} />
              <Route path="/costs" element={<ProtectedRoute><CostDashboard /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsView /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
