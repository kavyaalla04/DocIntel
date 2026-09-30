import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { useSearchParams } from 'react-router-dom';
import { Eye } from 'lucide-react';

const CleaningObservatoryView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const docId = searchParams.get('docId');

  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await apiFetch(`/api/v1/documents/${docId || 'demo'}/cleaning-report`);
        const data = await res.json();
        setReportData(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchReport();
  }, [docId]);

  const report = reportData?.report || {
    headersRemoved: 4,
    footersRemoved: 3,
    pageNumbersRemoved: 12,
    ocrArtifactsFixed: 8,
    duplicateLinesRemoved: 6,
    whitespaceCleaned: 24,
    cleaningQualityScore: 96
  };

  return (
    <div className="workspace-page" style={{ display: 'grid', gap: '24px' }}>
      
      {/* Header */}
      <div className="glass-card page-intro">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="badge-glass badge-emerald"><Eye size={13} /> Preprocessing Transparency</span>
            <h1 style={{ fontSize: '26px', fontWeight: '800', marginTop: '4px' }}>
              Document Cleaning <span className="gradient-text">Observatory</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '2px' }}>
              Before/After viewer showcasing removal of duplicate headers, page numbers, OCR noise, and whitespace artifacts.
            </p>
          </div>

          <div className="glass-card-sm" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#34d399' }}>{report.cleaningQualityScore}/100</div>
            <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Cleaning Quality Score</div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="observatory-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Headers Removed', val: report.headersRemoved, color: '#60a5fa' },
          { label: 'Footers Removed', val: report.footersRemoved, color: '#38bdf8' },
          { label: 'Page Numbers Purged', val: report.pageNumbersRemoved, color: '#c084fc' },
          { label: 'OCR Noise Fixed', val: report.ocrArtifactsFixed, color: '#34d399' },
          { label: 'Duplicates Removed', val: report.duplicateLinesRemoved, color: '#fbbf24' },
          { label: 'Whitespace Cleaned', val: report.whitespaceCleaned, color: '#fb7185' },
        ].map((m, i) => (
          <div key={i} className="glass-card-sm observatory-metric" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: m.color }}>{m.val}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Side-by-Side Split Viewer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Raw Extraction */}
        <div className="glass-card" style={{ borderLeft: '4px solid #f43f5e' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fb7185', marginBottom: '12px' }}>
            🔴 Raw Extracted Content (With Noise & Artifacts)
          </h3>
          <pre style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            whiteSpace: 'pre-wrap',
            maxHeight: '400px',
            overflowY: 'auto',
            color: '#cbd5e1'
          }}>
            {reportData?.rawContent || `PAGE 1 OF 50 - CONFIDENTIAL - WWW.DOCUMENT.COM\n00192834\n\nEXECUTIVE SYMMARY\nTh e company faces operational hazard s in cloud infra structure .\nPAGE 1 OF 50 - CONFIDENTIAL\n\nSECTION 1: FINANCIAL OVERVIEW\nQuarterly revenue reached $ 42.8 Million .\n© 2026 COPYRIGHT - PAGE 2`}
          </pre>
        </div>

        {/* Cleaned Output */}
        <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#34d399', marginBottom: '12px' }}>
            🟢 Cleaned Output (Ready for Multi-Agent Analysis)
          </h3>
          <pre style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            whiteSpace: 'pre-wrap',
            maxHeight: '400px',
            overflowY: 'auto',
            color: '#f8fafc'
          }}>
            {reportData?.cleanedContent || `EXECUTIVE SUMMARY\nThe company faces operational hazards in cloud infrastructure.\n\nSECTION 1: FINANCIAL OVERVIEW\nQuarterly revenue reached $42.8 Million.`}
          </pre>
        </div>

      </div>

    </div>
  );
};

export default CleaningObservatoryView;
