import type { Action } from '../types/colt-agent';

interface ActionsPanelProps {
  actions: Action[];
  selectedRunId: string | null;
}

export default function ActionsPanel({ actions, selectedRunId }: ActionsPanelProps) {
  const filteredActions = selectedRunId
    ? actions.filter((a) => a.runId === selectedRunId)
    : actions;

  if (filteredActions.length === 0) {
    return (
      <div className="colt-agent-empty">
        <div className="colt-agent-empty-icon">📈</div>
        <p>No trading actions recommended yet.</p>
      </div>
    );
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString();
    } catch {
      return timestamp;
    }
  };

  const buyActions = filteredActions.filter((a) => a.type === 'buy');
  const sellActions = filteredActions.filter((a) => a.type === 'sell');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '600px', overflowY: 'auto' }}>
      {buyActions.length > 0 && (
        <div>
          <h3 style={{ color: '#4caf50', margin: '0 0 0.75rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
            Buy Recommendations ({buyActions.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {buyActions.map((action) => (
              <ActionCard key={action.id} action={action} formatTimestamp={formatTimestamp} />
            ))}
          </div>
        </div>
      )}

      {sellActions.length > 0 && (
        <div>
          <h3 style={{ color: '#f44336', margin: '0 0 0.75rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
            Sell Recommendations ({sellActions.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sellActions.map((action) => (
              <ActionCard key={action.id} action={action} formatTimestamp={formatTimestamp} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionCard({
  action,
  formatTimestamp,
}: {
  action: Action;
  formatTimestamp: (timestamp: string) => string;
}) {
  const isBuy = action.type === 'buy';
  const color = isBuy ? '#4caf50' : '#f44336';
  const bgColor = isBuy ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)';

  return (
    <div
      style={{
        padding: '1rem',
        background: bgColor,
        border: `1px solid ${color}33`,
        borderRadius: '6px',
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              background: color,
              color: '#ffffff',
              borderRadius: '4px',
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {action.type}
          </span>
          <strong style={{ color: '#ffffff', fontSize: '1.1rem' }}>{action.ticker}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#888', fontSize: '0.85rem' }}>{formatTimestamp(action.timestamp)}</span>
          <span
            style={{
              padding: '0.25rem 0.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              fontSize: '0.85rem',
              color: '#ffffff',
            }}
          >
            {action.confidence}% confidence
          </span>
        </div>
      </div>
      <p style={{ color: '#e0e0e0', margin: '0.5rem 0', lineHeight: 1.6 }}>{action.rationale}</p>
      {(action.targetPrice || action.stopLoss || action.quantity) && (
        <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.9rem' }}>
          {action.targetPrice && (
            <span style={{ color: '#b0b0b0' }}>
              Target: <strong style={{ color: '#ffffff' }}>${action.targetPrice.toFixed(2)}</strong>
            </span>
          )}
          {action.stopLoss && (
            <span style={{ color: '#b0b0b0' }}>
              Stop Loss: <strong style={{ color: '#ffffff' }}>${action.stopLoss.toFixed(2)}</strong>
            </span>
          )}
          {action.quantity && (
            <span style={{ color: '#b0b0b0' }}>
              Quantity: <strong style={{ color: '#ffffff' }}>{action.quantity}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

