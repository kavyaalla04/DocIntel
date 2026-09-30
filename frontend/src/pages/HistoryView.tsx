import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock3, FileText, Sparkles, RefreshCw } from 'lucide-react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';

interface HistoryItem {
  type: 'document' | 'summary';
  documentId: string;
  summaryId?: string;
  title: string;
  status?: string;
  language?: string;
  createdAt?: string;
}

const HistoryView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const allItems: HistoryItem[] = [];
      let skip = 0;
      let hasMore = true;
      while (hasMore) {
        const response = await apiFetch(`/api/v1/history?limit=100&skip=${skip}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Unable to load history');
        const page = data.history || [];
        allItems.push(...page);
        if (page.length === 0) break;
        hasMore = Boolean(data.hasMore);
        skip += page.length;
      }
      setItems(allItems);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, [user?.userId]);

  const sortedItems = [...items].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return (
    <div className="workspace-page" style={{ display: 'grid', gap: '24px' }}>
      <div className="glass-card page-intro" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <span className="badge-glass badge-blue"><Clock3 size={12} /> Processing history</span>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginTop: '10px' }}>
            Your documents <span className="gradient-text">and summaries</span>
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '4px' }}>
            {user?.role === 'Administrator' ? 'Viewing workspace activity across users.' : 'Only activity for documents you uploaded is shown.'}
          </p>
        </div>
        <button onClick={loadHistory} className="btn-secondary-glass"><RefreshCw size={15} /> Refresh</button>
      </div>

      {loading ? <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading your history…</div> : sortedItems.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No document processing history yet.</div>
      ) : (
        <div className="history-stream" style={{ display: 'grid', gap: '12px' }}>
          {sortedItems.map((item, index) => (
            <button key={`${item.type}-${item.summaryId || item.documentId}-${index}`} onClick={() => navigate(item.type === 'summary' && item.summaryId ? `/summary?summaryId=${item.summaryId}` : `/summary?docId=${item.documentId}`)} className="glass-card-sm history-row" style={{ width: '100%', textAlign: 'left', color: 'inherit', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {item.type === 'summary' ? <Sparkles size={20} color="#c084fc" /> : <FileText size={20} color="#60a5fa" />}
                <span>
                  <strong style={{ display: 'block' }}>{item.title}</strong>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>{item.type === 'summary' ? `Summary${item.language ? ` · ${item.language}` : ''}` : `Document · ${item.status || 'processed'}`}</span>
                </span>
              </span>
              <time style={{ color: '#94a3b8', fontSize: '12px', whiteSpace: 'nowrap' }}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</time>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;
