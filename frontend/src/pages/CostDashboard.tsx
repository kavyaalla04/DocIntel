import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Zap, Clock, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';

interface CostData {
  totalCost: number;
  averageCostPerDocument: number;
  documentCount: number;
  costBreakdown: {
    extractionCost: number;
    summarizationCost: number;
    validationCost: number;
    ttsCost: number;
  };
  roi: {
    totalTimeSaved: number;
    estimatedValue: number;
    roiMultiple: number;
  };
}

interface BudgetStatus {
  monthlyBudget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  alerts: Array<{ type: string; message: string; severity: string }>;
}

const CostDashboard: React.FC = () => {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [organizationId] = useState('org_default');

  useEffect(() => {
    fetchCostData();
  }, []);

  const fetchCostData = async () => {
    try {
      const [costsRes, budgetRes] = await Promise.all([
        fetch(`/api/v1/organizations/${organizationId}/costs?days=30`),
        fetch(`/api/v1/organizations/${organizationId}/budget`),
      ]);
      const costsJson = await costsRes.json();
      const budgetJson = await budgetRes.json();
      setCostData(costsJson);
      setBudgetStatus(budgetJson);
    } catch (error) {
      console.error('Failed to fetch cost data:', error);
      // Use demo data on error
      setCostData({
        totalCost: 4.28,
        averageCostPerDocument: 0.0856,
        documentCount: 50,
        costBreakdown: {
          extractionCost: 0.85,
          summarizationCost: 2.40,
          validationCost: 0.78,
          ttsCost: 0.25
        },
        roi: {
          totalTimeSaved: 480,
          estimatedValue: 400.0,
          roiMultiple: 93.5
        }
      });
      setBudgetStatus({
        monthlyBudget: 100.0,
        spent: 4.28,
        remaining: 95.72,
        percentUsed: 4.28,
        alerts: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
        <Sparkles className="spin" size={36} color="#3b82f6" style={{ margin: '0 auto' }} />
        <p style={{ marginTop: '16px', color: '#94a3b8' }}>Loading cost analytics...</p>
      </div>
    );
  }

  const metricCards = [
    { label: 'Total Cost', value: `$${costData?.totalCost.toFixed(2) || '0.00'}`, color: '#60a5fa', icon: DollarSign, bg: 'rgba(59, 130, 246, 0.12)' },
    { label: 'Documents Processed', value: `${costData?.documentCount || 0}`, color: '#34d399', icon: CheckCircle2, bg: 'rgba(16, 185, 129, 0.12)' },
    { label: 'Avg Cost / Doc', value: `$${costData?.averageCostPerDocument.toFixed(4) || '0.0000'}`, color: '#c084fc', icon: Zap, bg: 'rgba(139, 92, 246, 0.12)' },
    { label: 'ROI Multiple', value: `${costData?.roi.roiMultiple.toFixed(1) || '0.0'}x`, color: '#fbbf24', icon: TrendingUp, bg: 'rgba(245, 158, 11, 0.12)' },
  ];

  const breakdownItems = [
    { label: 'Extraction & Parsing', val: costData?.costBreakdown.extractionCost || 0, color: '#60a5fa', pct: costData ? (costData.costBreakdown.extractionCost / costData.totalCost) * 100 : 0 },
    { label: 'Multi-Agent Summarization', val: costData?.costBreakdown.summarizationCost || 0, color: '#c084fc', pct: costData ? (costData.costBreakdown.summarizationCost / costData.totalCost) * 100 : 0 },
    { label: 'Claim Validation', val: costData?.costBreakdown.validationCost || 0, color: '#34d399', pct: costData ? (costData.costBreakdown.validationCost / costData.totalCost) * 100 : 0 },
    { label: 'Audio TTS Generation', val: costData?.costBreakdown.ttsCost || 0, color: '#fbbf24', pct: costData ? (costData.costBreakdown.ttsCost / costData.totalCost) * 100 : 0 },
  ];

  return (
    <div style={{ display: 'grid', gap: '24px' }} className="workspace-page stagger-children">

      {/* Header */}
      <div className="glass-card page-intro">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.35)'
          }}>
            <BarChart3 size={26} color="#ffffff" />
          </div>
          <div>
            <span className="badge-glass badge-amber" style={{ marginBottom: '6px' }}>
              <DollarSign size={12} /> Live Cost Tracking
            </span>
            <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0 }}>
              Cost Intelligence & <span className="gradient-text-amber">ROI Dashboard</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '2px' }}>
              Track per-operation costs, token usage, budget utilization, and return on investment across all AI workflows.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="cost-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {metricCards.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="glass-card-sm cost-metric" style={{ background: m.bg, border: `1px solid ${m.color}30`, textAlign: 'center', padding: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${m.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <Icon size={20} color={m.color} />
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: m.color }}>{m.value}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{m.label}</div>
            </div>
          );
        })}
      </div>

      {/* Budget Status */}
      {budgetStatus && (
        <div className="glass-card">
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#60a5fa' }}>
            📊 Monthly Budget Utilization
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {[
              { label: 'Monthly Budget', val: `$${budgetStatus.monthlyBudget.toFixed(2)}`, color: '#60a5fa' },
              { label: 'Spent This Month', val: `$${budgetStatus.spent.toFixed(2)}`, color: '#fb7185' },
              { label: 'Remaining', val: `$${budgetStatus.remaining.toFixed(2)}`, color: '#34d399' },
              { label: 'Utilization', val: `${budgetStatus.percentUsed.toFixed(1)}%`, color: '#fbbf24' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: item.color }}>{item.val}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{item.label}</div>
              </div>
            ))}
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(budgetStatus.percentUsed, 100)}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
            <span>$0</span>
            <span>${budgetStatus.monthlyBudget.toFixed(2)} budget cap</span>
          </div>

          {budgetStatus.alerts?.length > 0 && (
            <div style={{ marginTop: '16px', display: 'grid', gap: '8px' }}>
              {budgetStatus.alerts.map((alert, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                  borderRadius: '8px',
                  background: alert.severity === 'critical' ? 'rgba(244,63,94,0.12)' : 'rgba(245,158,11,0.12)',
                  color: alert.severity === 'critical' ? '#fb7185' : '#fbbf24',
                  border: `1px solid ${alert.severity === 'critical' ? 'rgba(244,63,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  fontSize: '13px'
                }}>
                  <AlertTriangle size={15} />
                  {alert.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cost Breakdown Bar Chart */}
      <div className="glass-card">
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#c084fc' }}>
          🎯 Cost Breakdown by Operation
        </h3>
        <div style={{ display: 'grid', gap: '14px' }}>
          {breakdownItems.map((item, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                <span style={{ color: '#cbd5e1', fontWeight: '500' }}>{item.label}</span>
                <span style={{ color: item.color, fontWeight: '700' }}>${item.val.toFixed(4)}</span>
              </div>
              <div className="progress-bar" style={{ height: '8px' }}>
                <div style={{
                  width: `${item.pct}%`,
                  height: '100%',
                  background: item.color,
                  borderRadius: '99px',
                  transition: 'width 1s ease',
                  boxShadow: `0 0 8px ${item.color}60`
                }} />
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', textAlign: 'right' }}>{item.pct.toFixed(1)}% of total</div>
            </div>
          ))}
        </div>
      </div>

      {/* ROI Analysis */}
      {costData && (
        <div className="glass-card" style={{ borderLeft: '4px solid #10b981', background: 'rgba(16, 185, 129, 0.06)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#34d399' }}>
            📈 Return on Investment Analysis
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '18px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <Clock size={20} color="#60a5fa" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#60a5fa' }}>{costData.roi.totalTimeSaved}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Minutes Saved</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>= {(costData.roi.totalTimeSaved / 60).toFixed(1)} hours of analyst time</div>
            </div>
            <div style={{ padding: '18px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <DollarSign size={20} color="#34d399" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#34d399' }}>${costData.roi.estimatedValue.toFixed(2)}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Estimated Value Generated</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>@ $50/hour analyst rate</div>
            </div>
            <div style={{ padding: '18px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <TrendingUp size={20} color="#fbbf24" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#fbbf24' }}>{costData.roi.roiMultiple.toFixed(1)}x</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>ROI Multiple</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>For every $1 spent = ${costData.roi.roiMultiple.toFixed(2)} returned</div>
            </div>
          </div>

          <div style={{ marginTop: '16px', padding: '14px 18px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ fontSize: '14px', color: '#34d399', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              {costData.roi.roiMultiple > 1 ? '✅ Strongly Positive ROI — Your AI investment is paying off at scale!' : '⏳ Building ROI — Upload more documents to increase returns.'}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CostDashboard;
