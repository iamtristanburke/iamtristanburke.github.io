import type { Insight } from '../types/colt-agent';

interface InsightsPanelProps {
  insights: Insight[];
  selectedRunId: string | null;
}

export default function InsightsPanel({ insights, selectedRunId }: InsightsPanelProps) {
  const filteredInsights = selectedRunId
    ? insights.filter((i) => i.runId === selectedRunId)
    : insights;

  if (filteredInsights.length === 0) {
    return (
      <div className="colt-agent-empty">
        <div className="colt-agent-empty-icon">💡</div>
        <p>No insights available yet.</p>
      </div>
    );
  }

  const getCategoryColor = (category: Insight['category']) => {
    const colors: Record<Insight['category'], string> = {
      market: '#2196f3',
      sector: '#9c27b0',
      stock: '#ff9800',
      macro: '#4caf50',
      technical: '#f44336',
      fundamental: '#00bcd4',
    };
    return colors[category] || '#888';
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString();
    } catch {
      return timestamp;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
      {filteredInsights.map((insight) => (
        <div
          key={insight.id}
          style={{
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            borderLeft: `4px solid ${getCategoryColor(insight.category)}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.5rem',
                background: `${getCategoryColor(insight.category)}33`,
                color: getCategoryColor(insight.category),
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {insight.category}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#888', fontSize: '0.85rem' }}>{formatTimestamp(insight.timestamp)}</span>
              <span
                style={{
                  padding: '0.25rem 0.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  color: '#ffffff',
                }}
              >
                {insight.confidence}% confidence
              </span>
            </div>
          </div>
          <p style={{ color: '#e0e0e0', margin: 0, lineHeight: 1.6 }}>{insight.content}</p>
          {insight.relatedTickers && insight.relatedTickers.length > 0 && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {insight.relatedTickers.map((ticker) => (
                <span
                  key={ticker}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    color: '#ffffff',
                  }}
                >
                  {ticker}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

