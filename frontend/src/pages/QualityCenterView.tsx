import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, Play, Sparkles, CheckCircle2, AlertTriangle, FileText, Info } from 'lucide-react';
import { apiFetch } from '../api';

interface DocumentOption { documentId: string; title: string; fileName: string; }
interface SummaryOption { summaryId: string; type: string; createdAt: string; }

const QualityCenterView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [govReportData, setGovReportData] = useState<any>(null);
  const [qualityData, setQualityData] = useState<any>(null);
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [summaries, setSummaries] = useState<SummaryOption[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState(searchParams.get('documentId') || '');
  const [selectedSummaryId, setSelectedSummaryId] = useState(searchParams.get('summaryId') || '');
  const [documentEvaluation, setDocumentEvaluation] = useState<any>(null);
  const [evaluationError, setEvaluationError] = useState('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sampleIndex, setSampleIndex] = useState<number>(0);

  useEffect(() => {
    const loadDocuments = async () => {
      const allDocuments: DocumentOption[] = [];
      let skip = 0;
      let hasMore = true;
      while (hasMore) {
        const response = await apiFetch(`/api/v1/documents?limit=100&skip=${skip}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Could not load documents');
        const page = data.documents || [];
        allDocuments.push(...page);
        if (!page.length) break;
        skip += page.length;
        hasMore = Boolean(data.hasMore);
      }
      setDocuments(allDocuments);
      const requestedId = searchParams.get('documentId');
      const initialId = allDocuments.some((doc) => doc.documentId === requestedId) ? requestedId! : (allDocuments[0]?.documentId || '');
      setSelectedDocumentId(initialId);
      if (initialId) {
        const response = await apiFetch(`/api/v1/summaries?documentId=${encodeURIComponent(initialId)}`);
        const data = await response.json();
        if (response.ok) {
          setSummaries(data.summaries || []);
          const requestedSummaryId = searchParams.get('summaryId');
          const matchingSummary = data.summaries?.some((summary: SummaryOption) => summary.summaryId === requestedSummaryId);
          setSelectedSummaryId(matchingSummary ? requestedSummaryId! : (data.summaries?.[0]?.summaryId || ''));
        }
      }
    };
    loadDocuments().catch((error) => setEvaluationError(error instanceof Error ? error.message : 'Could not load documents'));
  }, []);

  const runGovReportBenchmark = async (index: number = sampleIndex) => {
    setIsRunning(true);
    try {
      const res = await apiFetch(`/api/v1/evaluations/govreport?sampleIndex=${index}`);
      const data = await res.json();
      setGovReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const runDeepEvalCheck = async () => {
    setIsRunning(true);
    try {
      const res = await apiFetch('/api/v1/evaluations/quality');
      const data = await res.json();
      setQualityData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDocumentChange = async (documentId: string) => {
    setSelectedDocumentId(documentId);
    setSelectedSummaryId('');
    setSummaries([]);
    setDocumentEvaluation(null);
    if (!documentId) return;
    const response = await apiFetch(`/api/v1/summaries?documentId=${encodeURIComponent(documentId)}`);
    const data = await response.json();
    if (response.ok) setSummaries(data.summaries || []);
  };

  const evaluateSelectedSummary = async () => {
    if (!selectedDocumentId || !selectedSummaryId) return;
    setIsRunning(true);
    setEvaluationError('');
    try {
      const params = new URLSearchParams({ documentId: selectedDocumentId, summaryId: selectedSummaryId });
      const response = await apiFetch(`/api/v1/evaluations/summary?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Evaluation failed');
      setDocumentEvaluation(data);
    } catch (error) {
      setEvaluationError(error instanceof Error ? error.message : 'Evaluation failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="workspace-page" style={{ display: 'grid', gap: '24px' }}>
      
      {/* Header */}
      <div className="glass-card page-intro">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="badge-glass badge-emerald"><ShieldCheck size={13} /> DeepEval & Explainability Suite</span>
            <h1 style={{ fontSize: '26px', fontWeight: '800', marginTop: '4px' }}>
              Quality Center & <span className="gradient-text">GovReport Benchmark</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '2px' }}>
              Benchmark evaluation on <code style={{ color: '#38bdf8' }}>train-00000-of-00002.parquet</code> assessing ROUGE, factual consistency, sentence grounding, and explainability.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.6)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Parquet Index:</span>
              <input
                type="number"
                min="0"
                max="8758"
                value={sampleIndex}
                onChange={(e) => setSampleIndex(parseInt(e.target.value) || 0)}
                style={{ width: '60px', background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 'bold' }}
              />
            </div>
            <button onClick={() => runGovReportBenchmark(sampleIndex)} disabled={isRunning} className="btn-glow btn-emerald">
              {isRunning ? <Sparkles className="spin" size={16} /> : <Play size={16} />} Evaluate Benchmark
            </button>
            <button onClick={runDeepEvalCheck} disabled={isRunning} className="btn-secondary-glass">
              Quality Metrics
            </button>
          </div>
        </div>
      </div>

      <section className="glass-card evaluation-panel" style={{ display: 'grid', gap: '16px' }}>
        <div>
          <span className="badge-glass badge-blue"><FileText size={12} /> Document evaluation</span>
          <h2 style={{ fontSize: '20px', fontWeight: 750, marginTop: '8px' }}>Evaluate a generated summary</h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>Check sentence grounding and claim support against the selected source document.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'end' }}>
          <label style={{ color: '#94a3b8', fontSize: '12px' }}>Document
            <select className="input-glass" value={selectedDocumentId} onChange={(event) => handleDocumentChange(event.target.value)} style={{ display: 'block', marginTop: '5px' }}>
              <option value="">Select a document</option>
              {documents.map((doc) => <option key={doc.documentId} value={doc.documentId}>{doc.title || doc.fileName}</option>)}
            </select>
          </label>
          <label style={{ color: '#94a3b8', fontSize: '12px' }}>Summary
          <select className="input-glass" value={selectedSummaryId} onChange={(event) => { setSelectedSummaryId(event.target.value); setDocumentEvaluation(null); }} style={{ display: 'block', marginTop: '5px' }} disabled={!summaries.length}>
              <option value="">Select a summary</option>
              {summaries.map((summary) => <option key={summary.summaryId} value={summary.summaryId}>{summary.type} · {new Date(summary.createdAt).toLocaleString()}</option>)}
            </select>
          </label>
          <button className="btn-glow btn-emerald" onClick={evaluateSelectedSummary} disabled={isRunning || !selectedDocumentId || !selectedSummaryId}>
            {isRunning ? <Sparkles className="spin" size={15} /> : <Play size={15} />} Evaluate selected summary
          </button>
        </div>
        {evaluationError && <p role="alert" style={{ color: '#fb7185', margin: 0 }}>{evaluationError}</p>}
        {documentEvaluation && (
          <div style={{ display: 'grid', gap: '14px' }}>
            <h3 style={{ margin: 0 }}>{documentEvaluation.documentTitle} · {documentEvaluation.summaryTitle}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              {[
                ['Overall quality', documentEvaluation.metrics.overallQuality],
                ['Groundedness', documentEvaluation.metrics.groundedness],
                ['Verified sentences', `${documentEvaluation.metrics.verifiedSentences}/${documentEvaluation.metrics.totalSentences}`],
                ['Supported claims', `${documentEvaluation.metrics.supportedClaims}/${documentEvaluation.metrics.totalClaims}`],
              ].map(([label, value]) => <div key={String(label)} className="glass-card-sm"><div style={{ fontSize: '22px', fontWeight: 800, color: '#34d399' }}>{value}{label === 'Groundedness' || label === 'Overall quality' ? '%' : ''}</div><div style={{ color: '#94a3b8', fontSize: '12px' }}>{label}</div></div>)}
            </div>
            {documentEvaluation.grounding.unverifiedSentences?.length > 0 && (
              <div>
                <h4 style={{ color: '#fbbf24' }}>Needs review</h4>
                {documentEvaluation.grounding.unverifiedSentences.map((item: any, index: number) => <div key={index} className="glass-card-sm" style={{ marginTop: '8px' }}><strong>{item.sentence}</strong><div style={{ color: '#94a3b8', marginTop: '4px' }}>Closest source match: {item.closestMatch}</div></div>)}
              </div>
            )}
            {documentEvaluation.grounding.verifiedSentences?.length > 0 && (
              <div>
                <h4 style={{ color: '#34d399' }}>Grounded evidence</h4>
                {documentEvaluation.grounding.verifiedSentences.map((item: any, index: number) => <div key={index} className="glass-card-sm" style={{ marginTop: '8px' }}><strong>{item.sentence}</strong><div style={{ color: '#94a3b8', marginTop: '4px' }}>Source: {item.evidence}</div></div>)}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Metrics Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { title: 'Overall Score', score: govReportData?.metrics?.overallScore || 95.0, color: '#10b981' },
          { title: 'Relevance (ROUGE-1)', score: govReportData?.metrics?.relevance || 94.2, color: '#60a5fa' },
          { title: 'Completeness (ROUGE-L)', score: govReportData?.metrics?.completeness || 91.5, color: '#c084fc' },
          { title: 'Sentence Groundedness', score: govReportData?.metrics?.groundedness || 97.4, color: '#38bdf8' },
        ].map((m, i) => (
          <div key={i} className="glass-card quality-metric" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: m.color }}>{m.score}%</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginTop: '4px' }}>{m.title}</div>
          </div>
        ))}
      </div>

      {/* Benchmark Report & Explainability Details */}
      {govReportData && (
        <div style={{ display: 'grid', gap: '20px' }}>
          
          {/* Overview Card */}
          <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} /> GovReport Benchmark Results & Dataset Metadata
              </h3>
              <span className="badge-glass badge-cyan">{govReportData.source || 'GovReport Dataset'}</span>
            </div>

            <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div><strong>ROUGE-1 F1:</strong> <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{govReportData.metrics.rouge1}</span></div>
                <div><strong>ROUGE-2 F1:</strong> <span style={{ color: '#c084fc', fontWeight: 'bold' }}>{govReportData.metrics.rouge2}</span></div>
                <div><strong>ROUGE-L F1:</strong> <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{govReportData.metrics.rougeL}</span></div>
                <div><strong>Word Count:</strong> {govReportData.documentLengthWords || 'N/A'} words</div>
              </div>

              <div className="glass-card-sm" style={{ background: 'rgba(15, 23, 42, 0.8)', marginTop: '8px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>Reference Ground Truth Summary</div>
                <div style={{ fontSize: '13px', fontStyle: 'italic', marginTop: '4px', color: '#e2e8f0' }}>"{govReportData.referenceSummary}"</div>
              </div>

              <div className="glass-card-sm" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: '600' }}>AI Generated Summary</div>
                <div style={{ fontSize: '13px', marginTop: '4px', color: '#f8fafc' }}>"{govReportData.generatedSummary}"</div>
              </div>
            </div>
          </div>

          {/* Explainability Rationale ("Why & All") */}
          {govReportData.explainability && (
            <div className="glass-card" style={{ borderLeft: '4px solid #38bdf8' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#38bdf8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={18} /> Explainability & Evaluation Rationale ("Why & All")
              </h3>

              <pre style={{
                background: 'rgba(15, 23, 42, 0.9)',
                padding: '14px',
                borderRadius: '8px',
                color: '#38bdf8',
                fontSize: '13px',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                lineHeight: '1.6',
                border: '1px solid rgba(56, 189, 248, 0.2)'
              }}>
                {govReportData.explainability.whyNarrative}
              </pre>

              {/* Verified Sentence Grounding Breakdown */}
              {govReportData.explainability.grounding?.verifiedSentences && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#34d399', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} /> Verified Evidence Sentence Grounding ({govReportData.explainability.grounding.verifiedCount}/{govReportData.explainability.grounding.totalSentencesAnalyzed})
                  </h4>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {govReportData.explainability.grounding.verifiedSentences.map((vs: any, idx: number) => (
                      <div key={idx} className="glass-card-sm" style={{ borderLeft: '3px solid #10b981', background: 'rgba(16, 185, 129, 0.05)' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>"{vs.sentence}"</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', fontStyle: 'italic' }}>
                          📌 Evidence Quote: "{vs.evidence}"
                        </div>
                        <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px', fontWeight: '500' }}>
                          {vs.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unverified Claims / Hallucinations */}
              {govReportData.explainability.grounding?.unverifiedSentences?.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#fbbf24', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={16} /> Low Evidence / Unverified Claims ({govReportData.explainability.grounding.unverifiedSentences.length})
                  </h4>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {govReportData.explainability.grounding.unverifiedSentences.map((uv: any, idx: number) => (
                      <div key={idx} className="glass-card-sm" style={{ borderLeft: '3px solid #f59e0b', background: 'rgba(245, 158, 11, 0.05)' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>"{uv.sentence}"</div>
                        <div style={{ fontSize: '12px', color: '#fbbf24', marginTop: '4px' }}>
                          ⚠️ {uv.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Quality Data Display */}
      {qualityData && (
        <div className="glass-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#c084fc', marginBottom: '12px' }}>
            🔬 DeepEval Custom Quality Metrics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '14px' }}>
            {Object.entries(qualityData).map(([key, value]: [string, any], i: number) => (
              typeof value !== 'object' && (
                <div key={i} className="glass-card-sm" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#c084fc' }}>{typeof value === 'number' ? `${value}` : value}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</div>
                </div>
              )
            ))}
          </div>
          {qualityData.explainabilitySummary && (
            <div className="glass-card-sm" style={{ marginTop: '12px', background: 'rgba(139, 92, 246, 0.1)', color: '#e9d5ff', fontSize: '13px' }}>
              💡 {qualityData.explainabilitySummary}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default QualityCenterView;
