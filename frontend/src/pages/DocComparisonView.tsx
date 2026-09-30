import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { useSearchParams } from 'react-router-dom';
import { GitCompare, PlusCircle, MinusCircle, RefreshCw } from 'lucide-react';

const DocComparisonView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const docA = searchParams.get('docA');
  const docB = searchParams.get('docB');

  const [compData, setCompData] = useState<any>(null);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const res = await apiFetch('/api/v1/documents/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentIdA: docA || 'demo_1',
            documentIdB: docB || 'demo_2'
          })
        });
        const data = await res.json();
        setCompData(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchComparison();
  }, [docA, docB]);

  const changeSummary = compData?.changeSummary || "Version 2.0 introduces updated cloud infrastructure latency SLAs, an 18% cybersecurity budget increase, and 72-hour breach reporting mandates.";
  const diffs = compData?.diffHighlights || [
    { type: 'addition', text: 'Added section: Mandatory multi-factor authentication across all executive agency endpoints.' },
    { type: 'deletion', text: 'Removed legacy clause: Single-factor password rotation guidelines (Deprecated).' },
    { type: 'modification', text: 'Updated operational risk threshold from 5.0% to 2.4% SLA breach window.' }
  ];

  return (
    <div className="workspace-page" style={{ display: 'grid', gap: '24px' }}>
      
      {/* Header */}
      <div className="glass-card page-intro">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <GitCompare size={26} color="#34d399" />
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800' }}>
              Document Version & <span className="gradient-text">Side-by-Side Diff Viewer</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '2px' }}>
              Compare two versions of a document to identify added, removed, or modified risks, numbers, and decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Change-Focused Summary */}
      <div className="glass-card change-summary-panel" style={{ borderLeft: '4px solid #3b82f6', background: 'rgba(59, 130, 246, 0.08)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#60a5fa', marginBottom: '8px' }}>
          ⚡ Change-Focused Summary
        </h3>
        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#f8fafc' }}>
          {changeSummary}
        </p>
      </div>

      {/* Diff Highlights */}
      <div className="glass-card">
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>
          Key Version Differences
        </h3>

        <div style={{ display: 'grid', gap: '12px' }}>
          {diffs.map((d: any, idx: number) => (
            <div
              key={idx}
              className={`glass-card-sm diff-note diff-${d.type}`}
              style={{
                background: d.type === 'addition' ? 'rgba(16, 185, 129, 0.12)' : d.type === 'deletion' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                border: d.type === 'addition' ? '1px solid rgba(16, 185, 129, 0.3)' : d.type === 'deletion' ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              {d.type === 'addition' && <PlusCircle size={20} color="#34d399" />}
              {d.type === 'deletion' && <MinusCircle size={20} color="#fb7185" />}
              {d.type === 'modification' && <RefreshCw size={20} color="#fbbf24" />}

              <div style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '500' }}>
                {d.text}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default DocComparisonView;
