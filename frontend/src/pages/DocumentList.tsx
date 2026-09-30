import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Trash2, Eye, Sparkles, Search, GitCompare, Layers, RefreshCw } from 'lucide-react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';

interface DocItem {
  documentId: string;
  title: string;
  fileName: string;
  fileType: string;
  status: string;
  wordCount?: number;
  pageCount?: number;
  createdAt: string;
}

const DocumentList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const allDocuments: DocItem[] = [];
      let skip = 0;
      let hasMore = true;
      while (hasMore) {
        const res = await apiFetch(`/api/v1/documents?limit=100&skip=${skip}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Unable to load documents');
        const page = data.documents || [];
        allDocuments.push(...page);
        if (page.length === 0) break;
        hasMore = Boolean(data.hasMore);
        skip += page.length;
      }
      setDocuments(allDocuments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user?.userId]);

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await apiFetch(`/api/v1/documents/${docId}`, { method: 'DELETE' });
      setDocuments(prev => prev.filter(d => d.documentId !== docId));
    } catch (err) {
      alert('Delete failed');
    }
  };

  const toggleCompareSelect = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedForCompare.includes(docId)) {
      setSelectedForCompare(prev => prev.filter(id => id !== docId));
    } else {
      if (selectedForCompare.length >= 2) {
        setSelectedForCompare([selectedForCompare[1], docId]);
      } else {
        setSelectedForCompare(prev => [...prev, docId]);
      }
    }
  };

  const handleLaunchCompare = () => {
    if (selectedForCompare.length === 2) {
      navigate(`/compare?docA=${selectedForCompare[0]}&docB=${selectedForCompare[1]}`);
    }
  };

  const filteredDocs = documents.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="workspace-page library-page" style={{ display: 'grid', gap: '24px' }}>
      
      {/* Top Header */}
      <div className="glass-card page-intro">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800' }}>
              Document <span className="gradient-text">Repository & Knowledge Hub</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
              Browse ingested documents, inspect cleaning reports, generate summaries, or run side-by-side version comparison.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {selectedForCompare.length === 2 && (
              <button onClick={handleLaunchCompare} className="btn-glow btn-emerald">
                <GitCompare size={16} /> Compare Selected (2)
              </button>
            )}

            <button onClick={fetchDocuments} className="btn-secondary-glass">
              <RefreshCw size={15} /> Refresh
            </button>

            <button onClick={() => navigate('/')} className="btn-glow">
              + Ingest Document
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginTop: '20px', position: 'relative' }}>
          <Search size={18} color="#64748b" style={{ position: 'absolute', left: '14px', top: '12px' }} />
          <input
            type="text"
            className="input-glass"
            placeholder="Search documents by title, file name, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '42px' }}
          />
        </div>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px' }}>
          <Sparkles className="spin" size={32} color="#3b82f6" />
          <p style={{ marginTop: '12px', color: '#94a3b8' }}>Loading document repository...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px' }}>
          <Layers size={42} color="#64748b" style={{ marginBottom: '12px' }} />
          <h3>No documents found</h3>
          <p style={{ color: '#94a3b8', marginTop: '4px' }}>Upload a document or click 'Load Demo Dataset' to get started.</p>
          <button onClick={() => navigate('/')} className="btn-glow" style={{ marginTop: '16px' }}>
            Go to Upload
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredDocs.map((doc) => {
            const isSelected = selectedForCompare.includes(doc.documentId);
            return (
              <div
                key={doc.documentId}
                className="glass-card library-card"
                style={{
                  border: isSelected ? '1px solid #34d399' : '1px solid var(--border-glass)',
                  background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/summary?docId=${doc.documentId}`)}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="library-file-mark"><FileText size={22} strokeWidth={1.7} /></span>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                          {doc.title}
                        </h3>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          {doc.fileName}
                        </div>
                      </div>
                    </div>

                    <span className="badge-glass badge-emerald">
                      {doc.status}
                    </span>
                  </div>

                  <div className="library-metadata">
                    <span>{doc.pageCount || 1} pages</span>
                    <span>{doc.wordCount || 0} words</span>
                    <span>{doc.fileName.split('.').pop()?.toUpperCase() || 'FILE'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/cleaning?docId=${doc.documentId}`); }}
                      className="btn-secondary-glass"
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                      title="View Cleaning Observatory"
                    >
                      <Eye size={13} /> Cleaning
                    </button>

                    <button
                      onClick={(e) => toggleCompareSelect(doc.documentId, e)}
                      className="btn-secondary-glass"
                      style={{
                        padding: '6px 10px',
                        fontSize: '12px',
                        background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                        color: isSelected ? '#34d399' : '#94a3b8'
                      }}
                      title="Select for document comparison"
                    >
                      <GitCompare size={13} /> {isSelected ? 'Selected' : 'Compare'}
                    </button>
                  </div>

                  <button
                    onClick={(e) => handleDelete(doc.documentId, e)}
                    style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '6px' }}
                    title="Delete document"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default DocumentList;
