import type { AgentRun } from '../types/colt-agent';

interface AgentRunListProps {
  runs: AgentRun[];
  selectedRunId: string | null;
  onRunSelect: (runId: string) => void;
}

export default function AgentRunList({ runs, selectedRunId, onRunSelect }: AgentRunListProps) {
  if (runs.length === 0) {
    return (
      <div className="colt-agent-empty">
        <div className="colt-agent-empty-icon">📊</div>
        <p>No agent runs yet. The first run will appear here after the scheduled job executes.</p>
      </div>
    );
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getStatusColor = (status: AgentRun['status']) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'failed':
        return '#f44336';
      case 'running':
        return '#ff9800';
      default:
        return '#888';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {runs.map((run) => (
        <div
          key={run.id}
          onClick={() => onRunSelect(run.id)}
          style={{
            padding: '1rem',
            background: selectedRunId === run.id ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${selectedRunId === run.id ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (selectedRunId !== run.id) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedRunId !== run.id) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: getStatusColor(run.status),
                  boxShadow: `0 0 8px ${getStatusColor(run.status)}`,
                }}
              />
              <strong style={{ color: '#ffffff' }}>Run {run.id.slice(0, 8)}</strong>
              <span style={{ color: '#b0b0b0', fontSize: '0.9rem' }}>{formatTimestamp(run.timestamp)}</span>
            </div>
            {run.model && (
              <span style={{ color: '#888', fontSize: '0.85rem' }}>{run.model}</span>
            )}
          </div>
          {run.status === 'failed' && run.error && (
            <div style={{ color: '#f44336', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Error: {run.error}
            </div>
          )}
          {run.status === 'completed' && run.tokensUsed && (
            <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Tokens used: {run.tokensUsed.toLocaleString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

