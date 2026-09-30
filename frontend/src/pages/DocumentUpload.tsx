import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Database, Sparkles, Sliders, CheckCircle2, Loader2, Mic, Send, FileSearch, MessageSquareText, Headphones, ArrowRight } from 'lucide-react';
import { apiFetch } from '../api';

interface UploadJob {
  file: File;
  status: 'Queued' | 'Uploading' | 'Summarizing' | 'Complete' | 'Failed';
  documentId?: string;
  summaryId?: string;
  error?: string;
}

const DocumentUpload: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadJobs, setUploadJobs] = useState<UploadJob[]>([]);
  const [activeJobIndex, setActiveJobIndex] = useState<number | null>(null);
  const [pipelineCompletedStages, setPipelineCompletedStages] = useState(0);
  const [userQuery, setUserQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [summaryDepth, setSummaryDepth] = useState<'executive' | 'detailed'>('executive');
  const [focusArea, setFocusArea] = useState<string>('Full Document Overview');
  const [financeWeight, setFinanceWeight] = useState<number>(50);
  const [techWeight, setTechWeight] = useState<number>(50);
  const [statusMsg, setStatusMsg] = useState<string>('');

  const focusOptions = [
    'Full Document Overview',
    'Executive Overview',
    'Risks & Decisions',
    'Financial Impact',
    'Recommendations',
    'Technical Architecture',
    'Compliance & Governance'
  ];

  const pipelineStages = [
    { name: '1. Multi-Format Ingestion', description: 'Read the uploaded file and extract its text' },
    { name: '2. Intelligent Cleaning', description: 'Clean extracted content and reduce parsing noise' },
    { name: '3. Hierarchical Chunking', description: 'Organize content into sections and contextual chunks' },
    { name: '4. Document Analysis', description: 'Analyze document structure and identify key context' },
    { name: '5. Context-Aware Summarization', description: 'Create a summary guided by your interests and focus' },
    { name: '6. Claim-Level Validation', description: 'Check summary claims against the source document' },
    { name: '7. Quality Evaluation', description: 'Measure summary quality and factual grounding' },
    { name: '8. Audio Briefing Preparation', description: 'Prepare the summary script for voice playback' },
  ];

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) setFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) setFiles(Array.from(e.target.files));
  };

  const handleUpload = async (queryOverride?: string) => {
    if (!files.length) return;
    const query = (queryOverride ?? userQuery).trim();
    setIsUploading(true);
    const jobs = files.map((file) => ({ file, status: 'Queued' as const }));
    let singleSummaryId: string | undefined;
    setUploadJobs(jobs);
    setStatusMsg(`Processing ${jobs.length} document${jobs.length === 1 ? '' : 's'} one by one...`);

    for (let index = 0; index < jobs.length; index += 1) {
      setActiveJobIndex(index);
      setPipelineCompletedStages(0);
      const file = jobs[index].file;
      const updateJob = (updates: Partial<UploadJob>) => {
        setUploadJobs((previous) => previous.map((job, jobIndex) => jobIndex === index ? { ...job, ...updates } : job));
      };
      try {
        updateJob({ status: 'Uploading', error: undefined });
        const formData = new FormData();
        formData.append('file', file);
        const uploadResponse = await apiFetch('/api/v1/documents/upload', { method: 'POST', body: formData });
        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok || !uploadData.documentId) throw new Error(uploadData.detail || 'Upload failed');
        updateJob({ status: 'Summarizing', documentId: uploadData.documentId });
        setPipelineCompletedStages(3);
        const pipelineProgress = window.setInterval(() => {
          setPipelineCompletedStages((completed) => Math.min(7, completed + 1));
        }, 1800);
        try {
          const personalization = [
            focusArea !== 'Full Document Overview' ? `Give extra attention to ${focusArea}.` : '',
            financeWeight !== 50 || techWeight !== 50
              ? `When relevant, prioritize financial and risk details at ${financeWeight}% and technical and compliance details at ${techWeight}%.`
              : '',
          ].filter(Boolean).join('\n');
          const summaryResponse = await apiFetch('/api/v1/summaries/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: uploadData.documentId, config: { type: summaryDepth, focusArea: focusArea === 'Full Document Overview' ? undefined : focusArea, customInstructions: personalization, userQuestion: query || undefined, targetLanguage: 'English' } }),
          });
          const summaryData = await summaryResponse.json();
          if (!summaryResponse.ok || !summaryData.summaryId) throw new Error(summaryData.detail || 'Summary generation failed');
          setPipelineCompletedStages(pipelineStages.length);
          if (jobs.length === 1) singleSummaryId = summaryData.summaryId;
          updateJob({ status: 'Complete', summaryId: summaryData.summaryId });
        } finally {
          window.clearInterval(pipelineProgress);
        }
      } catch (error) {
        updateJob({ status: 'Failed', error: error instanceof Error ? error.message : 'Processing failed' });
      }
    }
    setActiveJobIndex(null);
    setIsUploading(false);
    setStatusMsg('Finished processing the selected documents. Each summary is linked to its source below.');
    if (jobs.length === 1 && singleSummaryId) navigate(`/summary?summaryId=${singleSummaryId}`);
  };

  const handleVoiceQuery = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatusMsg('Voice input is not supported in this browser. Type your interests or question instead.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = String(event.results?.[0]?.[0]?.transcript || '').trim();
      setIsRecording(false);
      if (!transcript) {
        setStatusMsg('I did not catch that. Please try speaking again or type your request.');
        return;
      }
      setUserQuery(transcript);
      if (files.length) {
        setStatusMsg(`Heard: “${transcript}” Starting document processing...`);
        void handleUpload(transcript);
      } else {
        setStatusMsg(`Heard: “${transcript}” Select one or more documents, then upload to process this request.`);
      }
    };
    recognition.onerror = () => {
      setIsRecording(false);
      setStatusMsg('Voice input could not be captured. Please try again or type your request.');
    };
    recognition.onend = () => setIsRecording(false);
    setIsRecording(true);
    recognition.start();
  };

  const handleLoadDemo = async () => {
    setIsUploading(true);
    setStatusMsg('Loading pre-cleaned enterprise demo dataset samples...');
    try {
      const res = await apiFetch('/api/v1/demo/load', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.documents && data.documents.length > 0) {
        const firstDoc = data.documents[0];
        setStatusMsg('Demo dataset loaded successfully!');
        setTimeout(() => {
          navigate(`/summary?docId=${firstDoc.documentId}`);
        }, 1000);
      }
    } catch (err: any) {
      alert('Failed to load demo data: ' + err.message);
      setIsUploading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      
      <section className="welcome-hero">
        <div className="welcome-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> YOUR DOCUMENTS, IN A NEW LIGHT</span>
          <h1 className="hero-heading">Find the <em>signal</em><br />inside the pages.</h1>
          <p className="hero-description">Turn reports, research, and spreadsheets into clear answers, grounded summaries, and briefings you can listen to.</p>
          <div className="hero-proof-row">
            <span><i>01</i> Evidence linked</span>
            <span><i>02</i> Ready to explore</span>
            <span><i>03</i> Yours to brief</span>
          </div>
          <button onClick={handleLoadDemo} disabled={isUploading} className="demo-link">
            <Database size={15} /> Explore with a sample <span aria-hidden="true">↗</span>
          </button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <svg className="hero-orbit" viewBox="0 0 520 390" fill="none">
            <defs>
              <linearGradient id="artSheet" x1="125" y1="58" x2="372" y2="327" gradientUnits="userSpaceOnUse"><stop stopColor="#FFFDF9"/><stop offset="1" stopColor="#E7EEFC"/></linearGradient>
              <linearGradient id="artAccent" x1="110" y1="92" x2="410" y2="322" gradientUnits="userSpaceOnUse"><stop stopColor="#73D9CA"/><stop offset=".48" stopColor="#93A9FF"/><stop offset="1" stopColor="#C5A1F4"/></linearGradient>
              <linearGradient id="artLine" x1="176" y1="182" x2="334" y2="275" gradientUnits="userSpaceOnUse"><stop stopColor="#7795DA"/><stop offset="1" stopColor="#69C9BB"/></linearGradient>
              <filter id="artShadow" x="87" y="32" width="352" height="370" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="18"/></filter>
            </defs>
            <circle cx="279" cy="196" r="154" fill="url(#artAccent)" fillOpacity=".13"/>
            <circle cx="279" cy="196" r="151" stroke="url(#artAccent)" strokeOpacity=".38" strokeDasharray="3 8"/>
            <ellipse cx="274" cy="329" rx="116" ry="20" fill="#455B8B" fillOpacity=".16" filter="url(#artShadow)"/>
            <g transform="rotate(-8 265 190)">
              <rect x="137" y="51" width="244" height="280" rx="22" fill="url(#artAccent)" fillOpacity=".2" stroke="url(#artAccent)" strokeOpacity=".66"/>
              <rect x="151" y="39" width="220" height="280" rx="18" fill="url(#artSheet)" stroke="white" strokeOpacity=".88"/>
              <rect x="174" y="67" width="60" height="7" rx="3.5" fill="#8DA2C7" fillOpacity=".55"/>
              <rect x="174" y="91" width="130" height="14" rx="7" fill="#344563" fillOpacity=".9"/>
              <rect x="174" y="115" width="166" height="6" rx="3" fill="#8492AA" fillOpacity=".34"/>
              <rect x="174" y="128" width="144" height="6" rx="3" fill="#8492AA" fillOpacity=".25"/>
              <rect x="174" y="154" width="174" height="90" rx="13" fill="#F1F5FC"/>
              <path d="M190 224v-19l23-17 22 10 26-30 24 17 27-12 20 19" stroke="url(#artLine)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M190 228h150" stroke="#B8C2D2" strokeOpacity=".55" strokeWidth="1.5"/>
              <circle cx="261" cy="168" r="5" fill="#91A6F4" stroke="white" strokeWidth="3"/>
              <rect x="174" y="259" width="74" height="38" rx="10" fill="#DDF4EB"/>
              <path d="m188 278 7 7 15-17" stroke="#43A789" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="257" y="259" width="91" height="7" rx="3.5" fill="#8594AE" fillOpacity=".4"/>
              <rect x="257" y="275" width="69" height="6" rx="3" fill="#8594AE" fillOpacity=".25"/>
            </g>
            <g transform="rotate(9 385 129)"><rect x="350" y="92" width="91" height="54" rx="17" fill="white" fillOpacity=".86" stroke="white"/><circle cx="375" cy="119" r="10" fill="#DFF4EC"/><path d="m370 119 4 4 7-8" stroke="#48A78A" strokeWidth="2" strokeLinecap="round"/><rect x="393" y="113" width="32" height="5" rx="2.5" fill="#53637D"/><rect x="393" y="123" width="23" height="4" rx="2" fill="#A0ADC0"/></g>
            <g transform="rotate(-8 116 267)"><rect x="66" y="243" width="110" height="58" rx="18" fill="white" fillOpacity=".9" stroke="#DDE5F1"/><circle cx="91" cy="272" r="11" fill="#E5E0FC"/><path d="M87 273c3-7 6-7 9 0M91.5 265v14" stroke="#8877D3" strokeWidth="1.7" strokeLinecap="round"/><rect x="110" y="266" width="48" height="5" rx="2.5" fill="#596A85"/><rect x="110" y="276" width="34" height="4" rx="2" fill="#A7B2C3"/></g>
            <circle cx="407" cy="229" r="5" fill="#F4C76B"/><circle cx="102" cy="149" r="4" fill="#79D5C1"/><path d="m413 174 4 11 11 4-11 4-4 11-4-11-11-4 11-4 4-11Z" fill="#F2C96C" fillOpacity=".9"/>
          </svg>
          <span className="art-caption"><span /> A clearer view, one document at a time</span>
        </div>
      </section>

      {isUploading && activeJobIndex !== null && uploadJobs[activeJobIndex] && (
        <section className="glass-card" aria-live="polite" aria-label="Document processing pipeline">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <span className="badge-glass badge-blue"><Sparkles size={13} /> Processing pipeline</span>
              <h3 style={{ marginTop: '10px' }}>Processing {uploadJobs[activeJobIndex].file.name}</h3>
            </div>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Document {activeJobIndex + 1} of {uploadJobs.length}</span>
          </div>
          <div style={{ marginTop: '18px', height: '6px', borderRadius: '999px', background: 'rgba(148,163,184,.16)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(pipelineCompletedStages / pipelineStages.length) * 100}%`, background: 'linear-gradient(90deg,#6366f1,#38bdf8)', transition: 'width .35s ease' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '16px' }}>
            {pipelineStages.map((stage, index) => {
              const done = index < pipelineCompletedStages;
              const active = index === pipelineCompletedStages && uploadJobs[activeJobIndex].status !== 'Failed';
              return (
                <div key={stage.name} className="glass-card-sm" style={{ border: active ? '1px solid #3b82f6' : done ? '1px solid rgba(16,185,129,.35)' : '1px solid rgba(255,255,255,.06)', opacity: done || active ? 1 : 0.7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: done ? '#34d399' : active ? '#60a5fa' : '#94a3b8', fontWeight: 700, fontSize: '13px' }}>
                    {done ? <CheckCircle2 size={16} /> : active ? <Loader2 className="spin" size={16} /> : <span style={{ width: 16, textAlign: 'center' }}>•</span>}
                    {stage.name}
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: '8px 0 0' }}>{stage.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="upload-workspace" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Upload Zone */}
        <div className="glass-card upload-panel">
          <div className="upload-panel-heading">
            <div className="upload-panel-icon"><Upload size={18} /></div>
            <div><span className="panel-overline">START WITH THE SOURCE</span><h3>Upload documents</h3></div>
            <span className="upload-count-pill">{files.length ? `${files.length} selected` : 'Step 01'}</span>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className={`document-drop-zone${files.length ? ' has-files' : ''}`}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept=".pdf,.docx,.pptx,.xlsx,.txt,.md,.json,.yaml"
            />
            <span className="drop-illustration"><FileText size={28} strokeWidth={1.5} /><span className="drop-sparkle">✦</span></span>
            <div className="drop-title">
              {files.length ? `${files.length} document${files.length === 1 ? '' : 's'} ready to go` : <>Drop your files here<br /><span>or browse your computer</span></>}
            </div>
            <div className="drop-caption">PDF, DOCX, PPTX, XLSX, TXT, JSON or YAML <span>·</span> Up to 100 MB each</div>
          </div>

          <div className="format-chip-row">
            <span className="badge-glass badge-blue">PDF (pypdf)</span>
            <span className="badge-glass badge-purple">DOCX</span>
            <span className="badge-glass badge-emerald">XLSX</span>
            <span className="badge-glass badge-amber">PPTX</span>
            <span className="badge-glass badge-rose">TXT / MD / JSON</span>
          </div>

          <label className="question-label" htmlFor="summary-interest">
            <span>Tell us what matters to you</span><small>Optional · ask a question or name a topic</small>
          </label>
          <div className="question-entry">
            <textarea
              id="summary-interest"
              className="input-glass"
              value={userQuery}
              onChange={(event) => setUserQuery(event.target.value)}
              placeholder="For example: Did sales increase this quarter? What risks should I know about?"
              disabled={isUploading}
              rows={3}
              style={{ flex: 1, resize: 'vertical' }}
            />
            <button type="button" className="btn-secondary-glass" onClick={handleVoiceQuery} disabled={isUploading || isRecording} aria-label="Speak your interests or question" title="Speak your interests or question" style={{ minWidth: '48px', alignSelf: 'flex-start' }}>
              <Mic size={18} />
            </button>
          </div>
          {isRecording && <div style={{ color: '#60a5fa', fontSize: '12px', marginTop: '6px' }}>Listening… Speak your request. Processing starts automatically when you finish.</div>}

          <label className="depth-label">
            Summary depth
            <select className="input-glass" value={summaryDepth} onChange={(event) => setSummaryDepth(event.target.value as 'executive' | 'detailed')} disabled={isUploading}>
              <option value="executive">Focused overview</option>
              <option value="detailed">In-depth, context-rich</option>
            </select>
          </label>

          <button
            onClick={() => void handleUpload()}
            disabled={!files.length || isUploading}
            className="btn-glow"
            style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }}
          >
            {isUploading ? <Sparkles className="spin" size={18} /> : <Upload size={18} />}
            {isUploading ? 'Processing Documents...' : `Upload & Summarize ${files.length || ''} Document${files.length === 1 ? '' : 's'}`}
          </button>

          {statusMsg && (
            <div style={{ marginTop: '12px', fontSize: '13px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={15} /> {statusMsg}
            </div>
          )}

          {files.length > 0 && !isUploading && uploadJobs.length === 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '12px', color: '#cbd5e1', fontSize: '12px' }}>
              <span>{files.map((item) => item.name).join(' · ')}</span>
              <button type="button" className="btn-secondary-glass" onClick={() => setFiles([])}>Clear</button>
            </div>
          )}

          {uploadJobs.length > 0 && (
            <div style={{ display: 'grid', gap: '8px', marginTop: '16px' }}>
              {uploadJobs.map((job) => (
                <div key={`${job.file.name}-${job.file.lastModified}`} className="glass-card-sm" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.file.name}</strong>
                    <span style={{ color: job.status === 'Failed' ? '#fb7185' : '#94a3b8', fontSize: '12px' }}>{job.error || job.status}</span>
                  </div>
                  {job.summaryId && <button className="btn-secondary-glass" onClick={() => navigate(`/summary?summaryId=${job.summaryId}`)}>Open this summary</button>}
                  {!job.summaryId && job.documentId && job.status === 'Failed' && <button className="btn-secondary-glass" onClick={() => navigate(`/summary?docId=${job.documentId}`)}>Retry summary</button>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personalized Intent & Importance Profiler */}
        <div className="glass-card intent-panel">
          <div className="intent-panel-heading">
            <div className="intent-panel-icon"><Sliders size={18} /></div>
            <div><span className="panel-overline">TUNE YOUR LENS</span><h3>Make it yours</h3></div>
            <span className="intent-status"><span /> PERSONALIZED</span>
          </div>
          <p className="intent-intro">Choose the angle that helps you see the document in the most useful way.</p>

          <div className="focus-control">
            <label className="control-label">Choose your focus</label>
            <div className="focus-options">
              {focusOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFocusArea(opt)}
                  className={`focus-chip${focusArea === opt ? ' is-active' : ''}`}
                  aria-pressed={focusArea === opt}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="priority-controls">
            <div className="priority-control priority-finance">
              <div className="priority-heading">
                <span><strong>Financial & risk</strong><small>Give numbers and exposure extra attention</small></span>
                <output>{financeWeight}<small>%</small></output>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={financeWeight}
                onChange={(e) => setFinanceWeight(Number(e.target.value))}
                className="priority-range"
              />
            </div>

            <div className="priority-control priority-technical">
              <div className="priority-heading">
                <span><strong>Technical & compliance</strong><small>Surface systems, controls, and obligations</small></span>
                <output>{techWeight}<small>%</small></output>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={techWeight}
                onChange={(e) => setTechWeight(Number(e.target.value))}
                className="priority-range"
              />
            </div>
          </div>

          <div className="intent-note">
            <span className="intent-note-mark">✳</span>
            <span><strong>Your lens is ready</strong><small>We’ll bring your focus into the summary and follow-up answers.</small></span>
          </div>
        </div>

      </div>

      <section className="journey-section" aria-labelledby="journey-title">
        <div className="journey-heading">
          <div>
            <span className="eyebrow"><span className="eyebrow-dot" /> A LITTLE GUIDE TO THE GOOD STUFF</span>
            <h2 id="journey-title">From file to <em>fresh perspective.</em></h2>
            <p>Think of it as a thoughtful reading companion. You bring the pages; we help you find what matters.</p>
          </div>
          <div className="journey-stamp" aria-hidden="true">
            <svg viewBox="0 0 92 92" fill="none"><circle cx="46" cy="46" r="40" stroke="currentColor" strokeDasharray="2 5"/><circle cx="46" cy="46" r="29" fill="currentColor" fillOpacity=".08"/><path d="m25 48 16 16 28-34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><path d="m67 18 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z" fill="#D5A957"/></svg>
          </div>
        </div>
        <div className="journey-track">
          {[
            { number: '01', title: 'Bring your documents', text: "Drop in a report, a stack of notes, or a spreadsheet. Add a question if you already know what you're looking for.", Icon: Upload, tone: 'sage' },
            { number: '02', title: 'Let them take flight', text: 'Your files are read, tidied, and organized into useful pieces of context.', Icon: Send, tone: 'lilac' },
            { number: '03', title: 'See the signal', text: 'Get the main story, key findings, risks, and recommendations in one clear view.', Icon: FileSearch, tone: 'butter' },
            { number: '04', title: 'Follow your curiosity', text: 'Ask a follow-up or explore the evidence behind an answer.', Icon: MessageSquareText, tone: 'peach' },
            { number: '05', title: 'Take it with you', text: 'Listen to a concise audio briefing and carry the important bits into your day.', Icon: Headphones, tone: 'blue' },
          ].map(({ number, title, text, Icon, tone }, index) => (
            <article className={`journey-card journey-${tone}`} key={number}>
              <div className="journey-card-top"><span>{number}</span><Icon size={20} strokeWidth={1.8} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
              {index < 4 && <ArrowRight className="journey-arrow" size={17} aria-hidden="true" />}
            </article>
          ))}
        </div>
        <div className="journey-footnote"><span className="journey-footnote-line" /> A calmer way to move from a reading list to the next right step.</div>
      </section>
    </div>
  );
};

export default DocumentUpload;
