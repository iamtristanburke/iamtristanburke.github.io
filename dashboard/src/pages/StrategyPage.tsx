import { useState } from 'react';
import { Config } from '../types/colt-road';
import ProgressBar from '../components/ProgressBar';
import Section from '../components/Section';
import FormGroup from '../components/FormGroup';
import ButtonGroup from '../components/ButtonGroup';

interface StrategyPageProps {
  config: Config;
  updateConfig: (key: keyof Config, value: any) => void;
  onRun: () => void;
  onBack: () => void;
}

interface Strategy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  params: any;
  paramFields: Array<{
    key: string;
    label: string;
    min?: number;
    max?: number;
    default?: number | boolean;
    explain?: string;
    type?: 'checkbox';
  }>;
}

export default function StrategyPage({ config, updateConfig, onRun, onBack }: StrategyPageProps) {
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);
  
  const strategies: Strategy[] = [
    {
      id: 'momentum',
      name: 'Momentum',
      description: 'Buy stocks with strong recent performance',
      enabled: config.strategies?.momentum?.enabled || false,
      params: config.strategies?.momentum || {
        enabled: false,
        lookbackDays: 20,
        threshold: 5
      },
      paramFields: [
        { key: 'lookbackDays', label: 'Lookback Period (days)', min: 5, max: 200, default: 20, explain: 'How many days to measure performance. Shorter = more reactive, Longer = more stable' },
        { key: 'threshold', label: 'Momentum Threshold (%)', min: 1, max: 20, default: 5, explain: 'Only buy if stock outperformed by this % or more' }
      ]
    },
    {
      id: 'meanReversion',
      name: 'Mean Reversion',
      description: 'Buy oversold stocks expecting bounce',
      enabled: config.strategies?.meanReversion?.enabled || false,
      params: config.strategies?.meanReversion || {
        enabled: false,
        rsiPeriod: 14,
        oversoldLevel: 30
      },
      paramFields: [
        { key: 'rsiPeriod', label: 'RSI Period (days)', min: 5, max: 30, default: 14, explain: 'Days to calculate RSI momentum indicator. 14 is standard' },
        { key: 'oversoldLevel', label: 'Oversold RSI Level', min: 20, max: 40, default: 30, explain: 'Buy when RSI drops below this (lower = more oversold)' }
      ]
    },
    {
      id: 'movingAverage',
      name: 'Moving Average Crossover',
      description: 'Buy on Golden Cross signals',
      enabled: config.strategies?.movingAverage?.enabled || false,
      params: config.strategies?.movingAverage || {
        enabled: false,
        shortMA: 50,
        longMA: 200
      },
      paramFields: [
        { key: 'shortMA', label: 'Short MA (days)', min: 10, max: 100, default: 50, explain: 'Faster moving average. Buy when this crosses above long MA' },
        { key: 'longMA', label: 'Long MA (days)', min: 100, max: 300, default: 200, explain: 'Slower moving average. Acts as trend confirmation' }
      ]
    },
    {
      id: 'breakout',
      name: 'Breakout',
      description: 'Buy when price breaks resistance',
      enabled: config.strategies?.breakout?.enabled || false,
      params: config.strategies?.breakout || {
        enabled: false,
        period: 252,
        volumeConfirm: true
      },
      paramFields: [
        { key: 'period', label: 'Lookback Period (days)', min: 20, max: 365, default: 252, explain: 'Buy when price breaks above high of this many days (252 = 1 year)' },
        { key: 'volumeConfirm', label: 'Require Volume Confirmation', type: 'checkbox', default: true, explain: 'Only buy if volume is higher than average (reduces false breakouts)' }
      ]
    },
    {
      id: 'contrarian',
      name: 'Contrarian',
      description: 'Buy stocks down from highs',
      enabled: config.strategies?.contrarian?.enabled || false,
      params: config.strategies?.contrarian || {
        enabled: false,
        drawdownThreshold: 20,
        recoveryPeriod: 60
      },
      paramFields: [
        { key: 'drawdownThreshold', label: 'Drawdown Threshold (%)', min: 10, max: 50, default: 20, explain: 'Buy when stock is down this % from recent high (bargain hunting)' },
        { key: 'recoveryPeriod', label: 'Recovery Period (days)', min: 20, max: 180, default: 60, explain: 'How many days to wait for recovery before selling' }
      ]
    },
    {
      id: 'technical',
      name: 'Technical Indicators',
      description: 'Combined MACD, RSI, Bollinger signals',
      enabled: config.strategies?.technical?.enabled || false,
      params: config.strategies?.technical || {
        enabled: false,
        macdFast: 12,
        macdSlow: 26,
        bollingerPeriod: 20
      },
      paramFields: [
        { key: 'macdFast', label: 'MACD Fast Period', min: 5, max: 20, default: 12, explain: 'Fast EMA period for MACD. 12 is standard' },
        { key: 'macdSlow', label: 'MACD Slow Period', min: 20, max: 40, default: 26, explain: 'Slow EMA period for MACD. 26 is standard' },
        { key: 'bollingerPeriod', label: 'Bollinger Period', min: 10, max: 30, default: 20, explain: 'Days for Bollinger Bands calculation. 20 is standard' }
      ]
    }
  ];
  
  const toggleStrategy = (strategyId: string) => {
    const strategy = strategies.find(s => s.id === strategyId);
    const currentStrategies = config.strategies || {};
    const currentParams = currentStrategies[strategyId as keyof typeof currentStrategies] || strategy?.params;
    
    updateConfig('strategies', {
      ...currentStrategies,
      [strategyId]: {
        ...currentParams,
        enabled: !currentParams?.enabled
      }
    });
  };
  
  const updateStrategyParam = (strategyId: string, paramKey: string, value: any) => {
    const currentStrategies = config.strategies || {};
    const currentParams = currentStrategies[strategyId as keyof typeof currentStrategies] || {};
    
    updateConfig('strategies', {
      ...currentStrategies,
      [strategyId]: {
        ...currentParams,
        [paramKey]: value
      }
    });
  };
  
  return (
    <div style={styles.container} className="page-container">
      <ProgressBar current={4} />
      <Section title="Trading Strategy & Execution">
        <p style={styles.sectionDesc}>
          Select and configure trading algorithms. Click a strategy to adjust its parameters.
        </p>
        
        <h3 style={styles.subsectionTitle}>Trading Algorithms</h3>
        <div style={styles.strategyGrid} className="strategy-grid">
          {strategies.map(strategy => (
            <div key={strategy.id}>
              <div 
                style={{
                  ...styles.strategyCard,
                  ...(strategy.params.enabled ? styles.strategyCardActive : {})
                }}
              >
                <div style={styles.strategyHeader} onClick={() => toggleStrategy(strategy.id)}>
                  <input 
                    type="checkbox" 
                    checked={strategy.params.enabled}
                    onChange={() => {}}
                    style={styles.strategyCheckbox}
                  />
                  <h4 style={styles.strategyName}>{strategy.name}</h4>
                </div>
                <p style={styles.strategyDesc}>{strategy.description}</p>
                
                {strategy.params.enabled && (
                  <div style={styles.strategyParams}>
                    <button 
                      style={styles.configButton}
                      onClick={() => setExpandedStrategy(expandedStrategy === strategy.id ? null : strategy.id)}
                    >
                      {expandedStrategy === strategy.id ? '▼ Hide Parameters' : '▶ Configure Parameters'}
                    </button>
                    
                    {expandedStrategy === strategy.id && (
                      <div style={styles.paramList}>
                        {strategy.paramFields.map(field => (
                          <div key={field.key} style={styles.paramField}>
                            <div style={{flex: 1}}>
                              <label style={styles.paramLabel}>{field.label}:</label>
                              {field.explain && (
                                <p style={styles.paramExplain}>{field.explain}</p>
                              )}
                            </div>
                            {field.type === 'checkbox' ? (
                              <input 
                                type="checkbox"
                                checked={strategy.params[field.key]}
                                onChange={(e) => updateStrategyParam(strategy.id, field.key, e.target.checked)}
                                style={styles.paramCheckbox}
                              />
                            ) : (
                              <input 
                                type="number"
                                value={strategy.params[field.key]}
                                onChange={(e) => updateStrategyParam(strategy.id, field.key, parseFloat(e.target.value))}
                                min={field.min}
                                max={field.max}
                                style={styles.paramInput}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <h3 style={styles.subsectionTitle}>Execution Parameters</h3>
        <div style={styles.formGrid} className="form-grid">
          <FormGroup label="Rebalancing Frequency">
            <select value={config.rebalanceFreq} onChange={(e) => updateConfig('rebalanceFreq', e.target.value)} style={styles.input}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </FormGroup>
          <FormGroup label="Commission per Trade ($)">
            <input type="number" value={config.commission} onChange={(e) => updateConfig('commission', parseFloat(e.target.value))} style={styles.input} step="0.1" />
          </FormGroup>
          <FormGroup label="Slippage (%)">
            <input type="number" value={config.slippage} onChange={(e) => updateConfig('slippage', parseFloat(e.target.value))} style={styles.input} step="0.05" />
          </FormGroup>
          <FormGroup label="Max Position Size (%)">
            <input type="number" value={config.positionLimit || 10} onChange={(e) => updateConfig('positionLimit', parseFloat(e.target.value))} style={styles.input} min="1" max="100" />
          </FormGroup>
        </div>
        
        <h3 style={styles.subsectionTitle}>Tax Configuration</h3>
        <p style={styles.sectionDesc}>
          Taxes significantly impact your returns. Configure your tax situation for accurate after-tax performance.
        </p>
        <div style={styles.formGrid} className="form-grid">
          <FormGroup label="Account Type">
            <select value={config.accountType || 'taxable'} onChange={(e) => updateConfig('accountType', e.target.value)} style={styles.input}>
              <option value="taxable">Taxable Brokerage</option>
              <option value="ira">Traditional IRA/401(k)</option>
              <option value="roth">Roth IRA</option>
            </select>
          </FormGroup>
          {config.accountType === 'taxable' && (
            <FormGroup label="Tax Bracket (%)">
              <select value={config.taxBracket || 24} onChange={(e) => updateConfig('taxBracket', parseInt(e.target.value))} style={styles.input}>
                <option value="10">10% - Up to $11,000</option>
                <option value="12">12% - $11,001 to $44,725</option>
                <option value="22">22% - $44,726 to $95,375</option>
                <option value="24">24% - $95,376 to $182,100</option>
                <option value="32">32% - $182,101 to $231,250</option>
                <option value="35">35% - $231,251 to $578,125</option>
                <option value="37">37% - Over $578,125</option>
              </select>
            </FormGroup>
          )}
        </div>
        {config.accountType === 'taxable' && (
          <div style={styles.taxNote}>
            <strong>Tax Impact:</strong> Your {config.taxBracket}% tax bracket means short-term gains are taxed at {config.taxBracket}% and long-term gains at {Math.min(20, config.taxBracket * 0.6).toFixed(0)}%. 
            Active trading strategies may generate more short-term gains, reducing after-tax returns.
          </div>
        )}
        {config.accountType === 'ira' && (
          <div style={styles.taxNote}>
            <strong>Tax-Deferred:</strong> Traditional IRA/401(k) grows tax-deferred. You'll pay taxes at withdrawal, but the backtest shows pre-tax growth.
          </div>
        )}
        {config.accountType === 'roth' && (
          <div style={styles.taxNote}>
            <strong>Tax-Free:</strong> Roth IRA grows tax-free. No taxes on gains or withdrawals after age 59½.
          </div>
        )}
        
        <div style={styles.strategySummary}>
          <strong>Active Strategies:</strong> {strategies.filter(s => s.params.enabled).length > 0 
            ? strategies.filter(s => s.params.enabled).map(s => s.name).join(', ')
            : 'None (Buy & Hold)'}
        </div>
        
        <ButtonGroup onBack={onBack} onNext={onRun} nextLabel="Run Backtest" />
      </Section>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '3rem 4rem'
  },
  sectionDesc: {
    marginBottom: '2rem',
    color: '#6d6658'
  },
  subsectionTitle: {
    fontFamily: "'Libre Baskerville', serif",
    fontSize: '1.5rem',
    color: '#0f1f35',
    marginTop: '3rem',
    marginBottom: '1.5rem',
    paddingBottom: '0.75rem',
    borderBottom: '2px solid #d9d2c1'
  },
  strategyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem'
  },
  strategyCard: {
    background: 'white',
    border: '3px solid #d9d2c1',
    padding: '1.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative'
  },
  strategyCardActive: {
    borderColor: '#2d4a2b',
    background: '#f5f2e9',
    boxShadow: '0 4px 12px rgba(45, 74, 43, 0.2)'
  },
  strategyHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '0.75rem'
  },
  strategyCheckbox: {
    width: '20px',
    height: '20px',
    accentColor: '#2d4a2b',
    cursor: 'pointer'
  },
  strategyName: {
    fontFamily: "'Libre Baskerville', serif",
    fontSize: '1.2rem',
    color: '#0f1f35',
    margin: 0
  },
  strategyDesc: {
    fontSize: '0.9rem',
    color: '#6d6658',
    lineHeight: 1.5,
    margin: 0
  },
  strategyParams: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '2px solid #d9d2c1'
  },
  configButton: {
    background: '#2d4a2b',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 600
  },
  paramList: {
    marginTop: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  paramField: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '0.5rem'
  },
  paramLabel: {
    fontSize: '0.85rem',
    color: '#2c2c2c',
    fontWeight: 600
  },
  paramExplain: {
    fontSize: '0.75rem',
    color: '#6d6658',
    fontStyle: 'italic',
    margin: '0.25rem 0 0 0',
    lineHeight: 1.4
  },
  paramInput: {
    width: '100px',
    padding: '0.4rem',
    border: '2px solid #d9d2c1',
    fontFamily: "'Montserrat', sans-serif"
  },
  paramCheckbox: {
    width: '20px',
    height: '20px',
    accentColor: '#2d4a2b'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2.5rem',
    marginBottom: '2rem'
  },
  input: {
    width: '100%',
    background: 'white',
    border: '2px solid #d9d2c1',
    padding: '0.85rem 1rem',
    color: '#2c2c2c',
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '0.95rem',
    borderRadius: 0
  },
  taxNote: {
    background: '#fff8f0',
    border: '2px solid #a98a4f',
    padding: '1.25rem',
    marginTop: '1rem',
    fontSize: '0.95rem',
    color: '#2c2c2c',
    lineHeight: 1.6
  },
  strategySummary: {
    background: '#f5f2e9',
    border: '2px solid #a98a4f',
    padding: '1.5rem',
    marginTop: '2rem',
    marginBottom: '2rem',
    fontSize: '1rem',
    color: '#2c2c2c'
  }
};

