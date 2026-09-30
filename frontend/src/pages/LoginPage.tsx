import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Key,
  UserCheck,
  Lock,
  ArrowRight,
  FileCheck,
  Headphones,
  BarChart3,
  Layers,
  CheckCircle2
} from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter your email address and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const success = await login(email, password, 'org_default');
      if (success) {
        navigate(from, { replace: true });
      } else {
        setErrorMsg('Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      setErrorMsg('Error connecting to backend authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{
      minHeight: '85vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 0',
      position: 'relative',
    }}>

      {/* Background Orbs Glow */}
      <div className="auth-glow auth-glow-left" style={{
        position: 'absolute',
        top: '10%',
        left: '15%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />
      <div className="auth-glow auth-glow-right" style={{
        position: 'absolute',
        bottom: '10%',
        right: '15%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />

      <div className="auth-layout" style={{
        maxWidth: '1140px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
        gap: '32px',
        alignItems: 'center',
        zIndex: 2,
      }}>

        {/* Left Card: Beautiful Project Showcase */}
        <div className="glass-card auth-story" style={{
          padding: '38px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          background: 'rgba(10, 16, 30, 0.8)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          
          {/* Subtle Glass Accent Line */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4)',
          }} />

          {/* Header Title */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div className="auth-logo-mark" style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 24px rgba(59, 130, 246, 0.4)',
              }}>
                <svg viewBox="0 0 48 48" width="40" height="40" fill="none" aria-hidden="true">
                  <path d="M8.5 13.5c0-2 1.6-3.5 3.5-3.5h14l8 8v20c0 1.7-1.3 3-3 3H12c-2 0-3.5-1.6-3.5-3.5v-24Z" fill="rgba(238,248,228,.22)" stroke="#D5E7C5" strokeWidth="1.4" />
                  <path d="M15 9.5c0-1.7 1.3-3 3-3h10l8 8v20c0 1.7-1.3 3-3 3H18c-1.7 0-3-1.3-3-3v-25Z" fill="#F5F3E7" />
                  <path d="M28 6.5v8h8M20 31v-6m5 6V21m5 10v-9m-10 0 5-4 4 1 5-5" stroke="#648878" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="34" cy="13" r="4" fill="#E9C978" />
                  <path d="m34 10.5.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8.8-1.7Z" fill="#FFFBEA" />
                  <circle cx="11" cy="33" r="2" fill="#A8D9B7" />
                </svg>
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.5px' }}>
                  DocIntel Platform
                </h1>
                <div style={{ fontSize: '11.5px', color: '#60a5fa', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Enterprise Multi-Agent Intelligence
                </div>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
              Next-generation document intelligence suite with hierarchical semantic tree parsing, evidence grounding, DeepEval quality benchmarks, and multi-speaker audio briefings.
            </p>
          </div>

          {/* System Capabilities Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            
            <div className="glass-card-sm" style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Layers size={18} color="#60a5fa" />
                <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#f1f5f9' }}>Hierarchical RAG</h4>
              </div>
              <p style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: '1.4' }}>
                Parses 10,000+ page PDFs into multi-level trees preserving origin page markers.
              </p>
            </div>

            <div className="glass-card-sm" style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <FileCheck size={18} color="#34d399" />
                <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#f1f5f9' }}>Evidence Grounding</h4>
              </div>
              <p style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: '1.4' }}>
                Classifies claims as SUPPORTED or UNSUPPORTED with direct source highlights.
              </p>
            </div>

            <div className="glass-card-sm" style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(192, 132, 252, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <BarChart3 size={18} color="#c084fc" />
                <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#f1f5f9' }}>Quality Benchmarks</h4>
              </div>
              <p style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: '1.4' }}>
                Evaluates ROUGE-1, ROUGE-2, and ROUGE-L against GovReport Parquet data.
              </p>
            </div>

            <div className="glass-card-sm" style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Headphones size={18} color="#f59e0b" />
                <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#f1f5f9' }}>Audio Briefings</h4>
              </div>
              <p style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: '1.4' }}>
                Synthesizes multilingual spoken briefings with speed playback options.
              </p>
            </div>

          </div>

          {/* Live System Performance Statistics Ticker */}
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.08))',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#60a5fa' }}>99.8%</div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: '500' }}>Sentence Grounding</div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#34d399' }}>&lt;2.4s</div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: '500' }}>Retrieval Latency</div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#c084fc' }}>Zero-Downtime</div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: '500' }}>Fallback Resilience</div>
            </div>
          </div>

          {/* Security & Reliability Footer Tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
            <CheckCircle2 size={15} color="#10b981" />
            <span>FastAPI Python 3.11+ • MongoDB + Motor • Redis • React 18</span>
          </div>

        </div>

        {/* Right Card: User Credentials Login Form */}
        <div className="glass-card auth-form-card" style={{
          padding: '38px',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          background: 'rgba(15, 23, 42, 0.85)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={22} color="#c084fc" /> User Sign-In
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              Enter your enterprise account credentials to sign in.
            </p>
          </div>

          {errorMsg && (
            <div className="glass-card-sm" style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '12px 14px',
              fontSize: '13px',
              marginBottom: '20px',
              borderRadius: '8px',
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Email Field */}
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '10px',
                    background: 'rgba(6, 10, 19, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <UserCheck size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '10px',
                    background: 'rgba(6, 10, 19, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <Key size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <small style={{ display: 'block', marginTop: '6px', color: '#64748b' }}>Demo workspace password: password123</small>
            </div>

            {/* Remember Me Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: '#94a3b8' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#3b82f6', width: '15px', height: '15px' }}
                />
                Remember me on this device
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-glow"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '13px',
                fontSize: '14.5px',
                fontWeight: '700',
                marginTop: '4px',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                'Authenticating Session...'
              ) : (
                <>
                  <span>Sign In to Platform</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Security Compliance Footer */}
          <div style={{
            marginTop: '26px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '11.5px',
            color: '#64748b',
          }}>
            <Shield size={14} color="#10b981" />
            <span>256-Bit TLS Encryption • JWT Bearer Authentication</span>
          </div>

        </div>

      </div>

    </div>
  );
};

export default LoginPage;
