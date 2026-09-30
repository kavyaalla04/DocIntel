import React, { useState } from 'react';
import { Settings, CheckCircle2 } from 'lucide-react';

const SettingsView: React.FC = () => {
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(1024);
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [savedMsg, setSavedMsg] = useState<string>('');

  const handleSave = () => {
    setSavedMsg('Settings updated successfully!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  return (
    <div className="workspace-page" style={{ display: 'grid', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="glass-card page-intro">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={26} color="#c084fc" />
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800' }}>
              Advanced Configuration <span className="gradient-text">& Settings Center</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '2px' }}>
              View managed gateway behavior, generation controls, and data retention settings.
            </p>
          </div>
        </div>
      </div>

      {/* Model & Generation Parameters */}
      <div className="glass-card settings-panel">
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#60a5fa' }}>
          🤖 LLM Provider & Routing Controls
        </h3>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div className="glass-card-sm">
            <strong style={{ display: 'block', fontSize: '13px', color: '#cbd5e1' }}>Model routing</strong>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '5px' }}>
              The managed gateway selects its chat model. The application does not send a model name.
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>Temperature ({temperature})</span>
              <span style={{ color: '#94a3b8' }}>Factual & Deterministic vs Creative</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              style={{ width: '100%', marginTop: '6px', accentColor: '#3b82f6' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1' }}>Max Output Tokens ({maxTokens})</label>
            <input
              type="number"
              className="input-glass"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              style={{ marginTop: '4px' }}
            />
          </div>
        </div>
      </div>

      {/* Data Retention & TTL Controls */}
      <div className="glass-card settings-panel">
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#34d399' }}>
          🔒 Privacy & MongoDB Retention Controls
        </h3>

        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1' }}>Automatic Chat & Summary Retention Period (Days)</label>
          <input
            type="number"
            className="input-glass"
            value={retentionDays}
            onChange={(e) => setRetentionDays(parseInt(e.target.value))}
            style={{ marginTop: '4px' }}
          />
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            MongoDB TTL indexes automatically purge expired chat records after {retentionDays} days.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {savedMsg ? (
          <span style={{ color: '#34d399', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} /> {savedMsg}
          </span>
        ) : <span />}

        <button onClick={handleSave} className="btn-glow btn-emerald">
          Save Configuration
        </button>
      </div>

    </div>
  );
};

export default SettingsView;
