import { useState, useEffect } from 'react';
import type { AgentRun, Insight, Action } from '../types/colt-agent';
import { fetchAgentRuns, fetchInsights, fetchActions } from '../services/coltAgentApi';
import AgentRunList from '../components/AgentRunList';
import InsightsPanel from '../components/InsightsPanel';
import ActionsPanel from '../components/ActionsPanel';
import PromptEditor from '../components/PromptEditor';
import AgentRunHistoryChart from '../components/AgentRunHistoryChart';
import ActionDistributionChart from '../components/ActionDistributionChart';
import InsightCategoriesChart from '../components/InsightCategoriesChart';
import '../styles/coltAgent.css';

export default function ColtAgentPage() {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRunId) {
      loadRunData(selectedRunId);
    }
  }, [selectedRunId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [runsData, insightsData, actionsData] = await Promise.all([
        fetchAgentRuns(10),
        fetchInsights(undefined, 20),
        fetchActions(undefined, 20),
      ]);
      setRuns(runsData);
      setInsights(insightsData);
      setActions(actionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRunData = async (runId: string) => {
    try {
      const [insightsData, actionsData] = await Promise.all([
        fetchInsights(runId),
        fetchActions(runId),
      ]);
      setInsights(insightsData);
      setActions(actionsData);
    } catch (error) {
      console.error('Error loading run data:', error);
    }
  };

  const handleRunSelect = (runId: string) => {
    setSelectedRunId(runId === selectedRunId ? null : runId);
  };

  const handleRefresh = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="colt-agent-page">
        <div className="colt-agent-container">
          <div className="colt-agent-loading">Loading agent data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="colt-agent-page">
      <div className="colt-agent-container">
        <div className="colt-agent-header">
          <h1 className="colt-agent-title">Colt Agent</h1>
          <p className="colt-agent-subtitle">AI-Powered Trading Analysis & Recommendations</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleRefresh}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: '#ffffff',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Refresh
            </button>
            <button
              onClick={() => setShowPromptEditor(!showPromptEditor)}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: '#ffffff',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {showPromptEditor ? 'Hide' : 'Edit'} Prompt
            </button>
          </div>
        </div>

        {showPromptEditor && (
          <div className="colt-agent-section">
            <PromptEditor onClose={() => setShowPromptEditor(false)} />
          </div>
        )}

        <div className="colt-agent-grid">
          <div className="colt-agent-card colt-agent-full-width">
            <h2 className="colt-agent-card-title">Recent Agent Runs</h2>
            <AgentRunList
              runs={runs}
              selectedRunId={selectedRunId}
              onRunSelect={handleRunSelect}
            />
          </div>
        </div>

        <div className="colt-agent-charts">
          <div className="colt-agent-card">
            <h2 className="colt-agent-card-title">Run History</h2>
            <AgentRunHistoryChart runs={runs} />
          </div>
          <div className="colt-agent-card">
            <h2 className="colt-agent-card-title">Action Distribution</h2>
            <ActionDistributionChart actions={actions} />
          </div>
          <div className="colt-agent-card">
            <h2 className="colt-agent-card-title">Insight Categories</h2>
            <InsightCategoriesChart insights={insights} />
          </div>
        </div>

        <div className="colt-agent-grid">
          <div className="colt-agent-card">
            <h2 className="colt-agent-card-title">Insights</h2>
            <InsightsPanel insights={insights} selectedRunId={selectedRunId} />
          </div>

          <div className="colt-agent-card">
            <h2 className="colt-agent-card-title">Trading Actions</h2>
            <ActionsPanel actions={actions} selectedRunId={selectedRunId} />
          </div>
        </div>
      </div>
    </div>
  );
}

