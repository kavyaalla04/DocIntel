import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Sparkles,
  Layers,
  GitCompare,
  ShieldCheck,
  BarChart3,
  Settings,
  Eye,
  User,
  Clock,
  X,
  LogIn,
  LogOut,
  CheckCircle2,
  Sun,
  Moon
} from 'lucide-react';

interface NavbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ theme, onToggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [providerStatus, setProviderStatus] = useState<string>('Checking...');
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);

  // Profile modal state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch('/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.llm_provider === 'LocalFallbackEngine') {
          setProviderStatus('Resilient Local Engine');
          setIsFallbackMode(true);
        } else if (data.llm_provider === 'ManagedGateway') {
          setProviderStatus('Managed AI Gateway');
          setIsFallbackMode(false);
        } else {
          setProviderStatus('OpenRouter API Active');
          setIsFallbackMode(false);
        }
      })
      .catch(() => {
        setProviderStatus('Offline Fallback Mode');
        setIsFallbackMode(true);
      });
  }, []);

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  const navCategories = [
    {
      category: 'WORKSPACE',
      items: [
        { path: '/', label: 'Ingest', icon: FileText, title: 'Upload & Parse Documents' },
        { path: '/documents', label: 'Library', icon: Layers, title: 'Document Repository' },
        { path: '/history', label: 'History', icon: Clock, title: 'Your processed documents and summaries' },
      ],
    },
    {
      category: 'INTELLIGENCE',
      items: [
        { path: '/summary', label: 'Summary & Audio', icon: Sparkles, title: 'Multi-Perspective Summaries & Audio' },
        { path: '/cleaning', label: 'Cleaning', icon: Eye, title: 'Data Cleaning Observatory' },
        { path: '/compare', label: 'Compare', icon: GitCompare, title: 'Document Version Intelligence' },
      ],
    },
    {
      category: 'GOVERNANCE',
      items: [
        { path: '/quality', label: 'Evaluation', icon: ShieldCheck, title: 'Document summary evaluation and benchmarks' },
        { path: '/costs', label: 'Costs & ROI', icon: BarChart3, title: 'Financial Analytics & Budgeting' },
        { path: '/settings', label: 'Settings', icon: Settings, title: 'Model & System Configuration' },
      ],
    },
  ];

  return (
    <>
      <header
        style={{
          background: scrolled
            ? 'rgba(6, 10, 19, 0.96)'
            : 'rgba(6, 10, 19, 0.88)',
          backdropFilter: 'blur(24px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
          borderBottom: scrolled
            ? '1px solid rgba(59, 130, 246, 0.22)'
            : '1px solid rgba(255, 255, 255, 0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          transition: 'all 0.3s ease',
          boxShadow: scrolled ? '0 10px 40px rgba(0, 0, 0, 0.6)' : 'none',
        }}
      >
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '8px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>

            {/* Brand Logo & Platform Title */}
            <Link to="/" className="brand-lockup" aria-label="DocIntel home">
              <div className="brand-mark" aria-hidden="true">
                <svg width="42" height="42" viewBox="0 0 48 48" fill="none">
                  <defs>
                    <linearGradient id="brandGlass" x1="7" y1="5" x2="42" y2="45" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#8BE9E0" />
                      <stop offset=".48" stopColor="#9CB8FF" />
                      <stop offset="1" stopColor="#D3A7FF" />
                    </linearGradient>
                    <linearGradient id="brandPaper" x1="13" y1="10" x2="34" y2="39" gradientUnits="userSpaceOnUse">
                      <stop stopColor="white" stopOpacity=".98" />
                      <stop offset="1" stopColor="#DCEBFF" stopOpacity=".88" />
                    </linearGradient>
                  </defs>
                  <path d="M8.5 13.5c0-2 1.6-3.5 3.5-3.5h14l8 8v20c0 1.7-1.3 3-3 3H12c-2 0-3.5-1.6-3.5-3.5v-24Z" fill="url(#brandGlass)" fillOpacity=".2" stroke="url(#brandGlass)" strokeWidth="1.5" />
                  <path d="M15 9.5c0-1.7 1.3-3 3-3h10l8 8v20c0 1.7-1.3 3-3 3H18c-1.7 0-3-1.3-3-3v-25Z" fill="url(#brandPaper)" />
                  <path d="M28 6.5v8h8" stroke="#7893C7" strokeWidth="1.4" strokeLinejoin="round" />
                  <path d="M20 31V25m5 6V21m5 10v-9" stroke="#719482" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="m20 22 5-4 4 1 5-5" stroke="#719482" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="34" cy="13" r="4" fill="#EBCB79" />
                  <path d="m34 10.5.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8.8-1.7Z" fill="#FFFBEA" />
                  <circle cx="11" cy="33" r="2" fill="#9EF0DA" />
                </svg>
              </div>
              <div>
                <div className="brand-name">
                  Doc<span>Intel</span>
                </div>
                <div className="brand-caption">
                  DOCUMENT INTELLIGENCE
                </div>
              </div>
            </Link>

            {/* Categorized Navigation Hub */}
            {isAuthenticated && (
              <nav style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '4px 8px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                overflowX: 'auto',
                scrollbarWidth: 'none',
              }}>
                {navCategories.map((cat, catIdx) => (
                  <React.Fragment key={cat.category}>
                    {catIdx > 0 && (
                      <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.1)', flexShrink: 0 }} />
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {cat.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            title={item.title}
                            style={{
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 11px',
                              borderRadius: '9px',
                              fontSize: '12px',
                              fontWeight: isActive ? '700' : '500',
                              color: isActive ? '#60a5fa' : '#94a3b8',
                              background: isActive ? 'rgba(59, 130, 246, 0.16)' : 'transparent',
                              border: isActive ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.2s ease',
                              position: 'relative',
                            }}
                          >
                            <Icon size={13.5} color={isActive ? '#60a5fa' : '#64748b'} />
                            <span>{item.label}</span>
                            {isActive && (
                              <span style={{
                                position: 'absolute',
                                bottom: '-2px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '16px',
                                height: '2px',
                                background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                                borderRadius: '2px',
                                boxShadow: '0 0 8px rgba(59, 130, 246, 0.8)',
                              }} />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </React.Fragment>
                ))}
              </nav>
            )}

            {/* Right Action Bar: Status, History & User Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

              <button
                type="button"
                onClick={onToggleTheme}
                className="theme-toggle"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
              
              {/* Resiliency Status Badge */}
              <span
                className={isFallbackMode ? 'badge-glass badge-amber' : 'badge-glass badge-emerald'}
                title="System Resiliency Status Engine"
                style={{ fontSize: '11px', padding: '5px 10px' }}
              >
                <span className={isFallbackMode ? 'status-dot status-dot-amber' : 'status-dot'} />
                {providerStatus}
              </span>

              {isAuthenticated ? (
                <>
                  {/* Profile Modal Trigger */}
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(139, 92, 246, 0.18))',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '10px',
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      color: '#f1f5f9',
                      fontSize: '12px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <User size={14} color="#c084fc" />
                    )}
                    <span>{user?.name || 'User Session'}</span>
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogoutClick}
                    className="btn-secondary-glass"
                    style={{ padding: '7px 10px', fontSize: '12px', color: '#f87171' }}
                    title="Sign Out of Session"
                  >
                    <LogOut size={14} color="#f87171" />
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="btn-glow"
                  style={{ textDecoration: 'none', padding: '7px 14px', fontSize: '12.5px', gap: '6px' }}
                >
                  <LogIn size={14} />
                  <span>Sign In</span>
                </Link>
              )}

            </div>

          </div>
        </div>
      </header>


      {/* User Profile Details Modal */}
      {isLoginModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(12px)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', border: '1px solid rgba(139, 92, 246, 0.3)', position: 'relative' }}>
            <button
              onClick={() => setIsLoginModalOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3b82f6', marginBottom: '10px' }} />
              ) : (
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                  <User size={24} color="#fff" />
                </div>
              )}
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>{user?.name || 'Active Session'}</h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>{user?.email || 'authenticated@enterprise.com'}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '4px', display: 'block' }}>User ID</label>
                <div style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#60a5fa', fontSize: '13.5px', fontFamily: 'monospace' }}>
                  {user?.userId || 'usr_default'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Organization Tenant</label>
                <div style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '13.5px' }}>
                  🏢 {user?.organizationId || 'org_default'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Assigned Access Role</label>
                <div style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#c084fc', fontSize: '13.5px', fontWeight: '600' }}>
                  ⚡ {user?.role || 'Senior Enterprise Architect'}
                </div>
              </div>

              <div className="glass-card-sm" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="#10b981" />
                <div style={{ fontSize: '12px', color: '#34d399' }}>
                  <strong>JWT Bearer Session Active</strong> (24-Hour Expiration)
                </div>
              </div>

              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="btn-glow"
                style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }}
              >
                Close Session Panel
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
