import { useState, useEffect } from 'react';
import type { PromptConfig } from '../types/colt-agent';
import { fetchPromptConfig, updatePromptConfig } from '../services/coltAgentApi';

interface PromptEditorProps {
  onClose: () => void;
}

export default function PromptEditor({ onClose }: PromptEditorProps) {
  const [config, setConfig] = useState<PromptConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadPrompt();
  }, []);

  const loadPrompt = async () => {
    setLoading(true);
    try {
      const promptConfig = await fetchPromptConfig();
      if (promptConfig) {
        setConfig(promptConfig);
      } else {
        // Default config if none exists
        setConfig({
          version: 1,
          systemMessage: 'You are a professional trading analyst. Analyze market conditions and provide actionable trading insights.',
          userPrompt: 'Analyze the current market conditions and provide insights and recommendations.',
          parameters: {
            model: 'gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 2000,
          },
        });
      }
    } catch (err) {
      setError('Failed to load prompt configuration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const success = await updatePromptConfig(config);
      if (success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError('Failed to save prompt. GitHub API integration required.');
      }
    } catch (err) {
      setError('Error saving prompt configuration');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof PromptConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  const handleParameterChange = (param: string, value: any) => {
    if (!config) return;
    setConfig({
      ...config,
      parameters: {
        ...config.parameters,
        [param]: value,
      },
    });
  };

  if (loading) {
    return (
      <div className="colt-agent-card">
        <div className="colt-agent-loading">Loading prompt configuration...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="colt-agent-card">
        <div className="colt-agent-empty">Failed to load prompt configuration</div>
      </div>
    );
  }

  return (
    <div className="colt-agent-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="colt-agent-card-title">Edit Prompt Configuration</h2>
        <button
          onClick={onClose}
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
          Close
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '0.75rem',
            background: 'rgba(244, 67, 54, 0.2)',
            border: '1px solid #f44336',
            borderRadius: '4px',
            color: '#f44336',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: '0.75rem',
            background: 'rgba(76, 175, 80, 0.2)',
            border: '1px solid #4caf50',
            borderRadius: '4px',
            color: '#4caf50',
            marginBottom: '1rem',
          }}
        >
          Prompt configuration saved successfully!
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ffffff', fontWeight: 600 }}>
            System Message
          </label>
          <textarea
            value={config.systemMessage}
            onChange={(e) => handleChange('systemMessage', e.target.value)}
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              color: '#ffffff',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              resize: 'vertical',
            }}
            placeholder="Enter system message for the LLM..."
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ffffff', fontWeight: 600 }}>
            User Prompt
          </label>
          <textarea
            value={config.userPrompt}
            onChange={(e) => handleChange('userPrompt', e.target.value)}
            style={{
              width: '100%',
              minHeight: '150px',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              color: '#ffffff',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              resize: 'vertical',
            }}
            placeholder="Enter user prompt for the LLM..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ffffff', fontWeight: 600 }}>
              Model
            </label>
            <input
              type="text"
              value={config.parameters.model}
              onChange={(e) => handleParameterChange('model', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: '#ffffff',
                fontFamily: 'inherit',
              }}
              placeholder="gpt-4o-mini"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ffffff', fontWeight: 600 }}>
              Temperature
            </label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={config.parameters.temperature}
              onChange={(e) => handleParameterChange('temperature', parseFloat(e.target.value))}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: '#ffffff',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ffffff', fontWeight: 600 }}>
              Max Tokens
            </label>
            <input
              type="number"
              min="1"
              max="4000"
              value={config.parameters.maxTokens}
              onChange={(e) => handleParameterChange('maxTokens', parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: '#ffffff',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              background: saving ? 'rgba(255, 255, 255, 0.2)' : '#4caf50',
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              fontWeight: 600,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Prompt'}
          </button>
          <button
            onClick={loadPrompt}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              color: '#ffffff',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Reset
          </button>
        </div>

        <div
          style={{
            padding: '0.75rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '4px',
            fontSize: '0.85rem',
            color: '#b0b0b0',
          }}
        >
          <strong>Note:</strong> Saving the prompt requires GitHub API integration. For now, this is a read-only view.
          The prompt is stored in <code>prompts/trading-agent.json</code> and can be edited manually or via the GitHub
          Actions workflow.
        </div>
      </div>
    </div>
  );
}

