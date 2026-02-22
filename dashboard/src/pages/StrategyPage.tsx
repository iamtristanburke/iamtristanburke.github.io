import { Config } from '../types/colt-road';
import ProgressBar from '../components/ProgressBar';
import Section from '../components/Section';
import FormGroup from '../components/FormGroup';
import ButtonGroup from '../components/ButtonGroup';
import { ALL_STOCKS } from '../utils/stockDatabase';
import { getPortfolioWeights } from '../utils/portfolioWeights';

const COLT_ICON = '/colt-icon.png?v=2';

/** Format a fraction (0–1) or decimal as percentage string, e.g. 0.067 → "6.7%". */
function formatPercent(value: number, decimals: number = 1): string {
  const pct = value * 100;
  return pct.toFixed(decimals) + '%';
}

interface StrategyPageProps {
  config: Config;
  updateConfig: (key: keyof Config, value: any) => void;
  onRun: () => void;
  backtestLoading?: boolean;
  onBack: () => void;
  onStepClick?: (step: number) => void;
  onOpenPositionSizingResearch?: () => void;
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

export default function StrategyPage({ config, updateConfig, onRun, backtestLoading, onBack, onStepClick, onOpenPositionSizingResearch }: StrategyPageProps) {
  const strategies: Strategy[] = [
    {
      id: 'buyAndHold',
      name: 'Buy and Hold',
      description: 'Hold positions with no systematic trading. Rebalance only when allocation drifts or thesis changes.',
      enabled: config.strategies?.buyAndHold?.enabled !== false,
      params: config.strategies?.buyAndHold || { enabled: true },
      paramFields: []
    },
    {
      id: 'momentum',
      name: 'Momentum',
      description: 'Buy stocks with strong recent performance',
      enabled: config.strategies?.momentum?.enabled || false,
      params: config.strategies?.momentum || {
        enabled: false,
        lookbackDays: 252,
        threshold: 5
      },
      paramFields: [
        { key: 'lookbackDays', label: 'Lookback Period (days)', min: 63, max: 504, default: 252, explain: 'Daily backtest uses this directly (default 252 trading days, with a 21-day skip for 12-1 momentum).' },
        { key: 'threshold', label: 'Momentum Threshold (%)', min: 0, max: 30, default: 5, explain: 'Only include stocks whose lookback return is at least this threshold.' }
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
        { key: 'macdFast', label: 'Fast MA Lookback (days)', min: 2, max: 100, default: 12, explain: 'Daily candles: fast trend window.' },
        { key: 'macdSlow', label: 'Slow MA Lookback (days)', min: 3, max: 300, default: 26, explain: 'Daily candles: slower trend confirmation.' },
        { key: 'bollingerPeriod', label: 'Bollinger Lookback (days)', min: 2, max: 120, default: 20, explain: 'Daily candles: 20 trading days is the common default.' }
      ]
    }
  ];
  
  /** Select exactly one trading strategy. Backtest will apply it retroactively. */
  const selectStrategy = (strategyId: string) => {
    const currentStrategies = config.strategies || {};
    const next: typeof currentStrategies = {};
    for (const s of strategies) {
      const params = currentStrategies[s.id as keyof typeof currentStrategies] || s.params;
      next[s.id as keyof typeof next] = {
        ...params,
        enabled: s.id === strategyId
      };
    }
    updateConfig('strategies', next);
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
      <ProgressBar current={4} onStepClick={onStepClick} />
      <Section title="3. How to size positions and trade the stocks?">
        <div style={styles.perspectiveHeadingRow}>
          <div style={styles.coltIconWrap}>
            <img src={COLT_ICON} alt="" style={styles.coltIconWhite} aria-hidden />
          </div>
          <h3 style={styles.subsectionTitleInRow}>Colt Road&apos;s Perspective</h3>
        </div>
        <p style={styles.perspectiveParagraph}>
          The best style for most investors is <strong>low-turnover, disciplined portfolio management</strong>: hold a focused list of high-quality names, rebalance thoughtfully, and trade only when the thesis breaks or allocation targets drift. Technical and algorithmic strategies can add value for active traders, but they increase turnover and taxes; we recommend using them sparingly or for a sleeve of the portfolio, not the core.
        </p>

        {onOpenPositionSizingResearch && (
          <button type="button" onClick={onOpenPositionSizingResearch} style={styles.researchBtn}>
            Colt Road&apos;s Research on Position Sizing and Trading
          </button>
        )}

        <h3 style={styles.subsectionTitle}>Trading Strategy</h3>
        <p style={styles.sectionDesc}>
          Select one strategy. The backtest will apply it retroactively to historical prices.
        </p>
        <div style={styles.strategyGrid} className="strategy-grid">
          {strategies.map(strategy => {
            const isActive = !!strategy.params.enabled;
            return (
            <div key={strategy.id}>
              <div 
                style={{
                  ...styles.strategyCard,
                  borderColor: isActive ? '#2d4a2b' : '#a98a4f',
                  background: isActive ? '#f5f2e9' : 'white',
                  boxShadow: isActive ? '0 4px 12px rgba(45, 74, 43, 0.2)' : 'none'
                }}
              >
                <div style={styles.strategyHeader} onClick={() => selectStrategy(strategy.id)}>
                  <input 
                    type="radio" 
                    name="tradingStrategy"
                    checked={strategy.params.enabled}
                    onChange={() => selectStrategy(strategy.id)}
                    style={styles.strategyCheckbox}
                  />
                  <h4 style={styles.strategyName}>{strategy.name}</h4>
                </div>
                <p style={styles.strategyDesc}>{strategy.description}</p>
                
                {strategy.params.enabled && strategy.paramFields.length > 0 && (
                  <div style={{ ...styles.strategyParams, borderTopColor: '#2d4a2b' }}>
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
                              style={{ ...styles.paramInput, borderColor: '#2d4a2b' }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )})}
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
        
        <div style={styles.portfolioOutputBottom}>
          <strong>Portfolio Output (Full Portfolio)</strong>
          <div style={{ ...styles.portfolioExportWrap, marginTop: '0.75rem', marginBottom: 0 }}>
            <table style={styles.portfolioTable}>
              <thead>
                <tr>
                  <th style={styles.portfolioTh}>Ticker</th>
                  <th style={styles.portfolioTh}>Name</th>
                  <th style={styles.portfolioTh}>Sleeve</th>
                  <th style={{ ...styles.portfolioTh, ...styles.portfolioRight }}>Weight (total portfolio)</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const weights = getPortfolioWeights(config.selectedStocks, config.positionLimit);
                  const equityPct = config.targetEquityPct / 100;
                  const debtPct = 1 - equityPct;
                  return (
                    <>
                      {config.selectedStocks.map((ticker) => {
                        const stock = ALL_STOCKS.find((s) => s.ticker === ticker);
                        const totalWeight = (weights[ticker] ?? 0) * equityPct;
                        return (
                          <tr key={`bottom-${ticker}`}>
                            <td style={styles.portfolioTd}>{ticker}</td>
                            <td style={styles.portfolioTd}>{stock?.name ?? ticker}</td>
                            <td style={styles.portfolioTd}>Equity</td>
                            <td style={{ ...styles.portfolioTd, ...styles.portfolioRight }}>
                              {formatPercent(totalWeight)}
                            </td>
                          </tr>
                        );
                      })}
                      <tr key="bottom-agg">
                        <td style={styles.portfolioTd}>AGG</td>
                        <td style={styles.portfolioTd}>iShares Core U.S. Aggregate Bond ETF</td>
                        <td style={styles.portfolioTd}>Debt</td>
                        <td style={{ ...styles.portfolioTd, ...styles.portfolioRight }}>
                          {formatPercent(debtPct)}
                        </td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
        <ButtonGroup onBack={onBack} onNext={onRun} nextLabel="Run Backtest" nextDisabled={backtestLoading} />
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
    color: '#6d6658',
    lineHeight: 1.5
  },
  subsectionTitle: {
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '1.35rem',
    color: '#0f1f35',
    marginTop: '2rem',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #d9d2c1'
  },
  subsectionTitleInRow: {
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '1.35rem',
    color: '#0f1f35',
    margin: 0,
    paddingBottom: 0
  },
  perspectiveHeadingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    marginTop: '2rem',
    marginBottom: '0.75rem',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #d9d2c1'
  },
  coltIconWrap: {
    width: '40px',
    height: '40px',
    flexShrink: 0,
    background: '#0f1f35',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px',
    boxSizing: 'border-box',
    border: 'none',
    outline: 'none'
  },
  coltIconWhite: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    filter: 'invert(1)',
    mixBlendMode: 'lighten'
  },
  perspectiveParagraph: {
    margin: '0 0 1.5rem 0',
    fontSize: '0.95rem',
    color: '#2c2c2c',
    lineHeight: 1.65,
    maxWidth: '720px'
  },
  researchBtn: {
    display: 'block',
    width: '100%',
    marginTop: '0.5rem',
    marginBottom: '1.5rem',
    padding: '0.5rem 1.25rem',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#0f1f35',
    background: '#e8eef4',
    border: '2px solid #0f1f35',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  optionRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1.5rem',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  portfolioExportTitle: {
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '1.1rem',
    color: '#0f1f35',
    marginTop: '1.5rem',
    marginBottom: '0.5rem'
  },
  portfolioExportWrap: {
    overflowX: 'auto',
    marginBottom: '1.5rem',
    border: '1px solid #d9d2c1',
    borderRadius: '6px',
    background: '#fbf9f4'
  },
  portfolioTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem'
  },
  portfolioTh: {
    textAlign: 'left',
    padding: '0.6rem 0.75rem',
    borderBottom: '2px solid #d9d2c1',
    color: '#0f1f35',
    fontWeight: 600
  },
  portfolioTd: {
    padding: '0.5rem 0.75rem',
    borderBottom: '1px solid #e8e4dc',
    color: '#2c2c2c'
  },
  portfolioRight: {
    textAlign: 'right'
  },
  portfolioWeightCell: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.2rem'
  },
  portfolioWeightInput: {
    width: '4.5rem',
    padding: '0.25rem 0.35rem',
    fontSize: '0.9rem',
    border: '1px solid #d9d2c1',
    borderRadius: '4px',
    textAlign: 'right'
  },
  portfolioWeightSuffix: {
    fontSize: '0.9rem',
    color: '#2c2c2c'
  },
  hint: {
    fontSize: '0.85rem',
    color: '#6d6658',
    marginTop: '-0.5rem',
    marginBottom: '1.5rem',
    lineHeight: 1.45
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontWeight: 600,
    color: '#2c2c2c',
    fontSize: '0.95rem'
  },
  strategyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem'
  },
  strategyCard: {
    background: 'white',
    border: '3px solid #a98a4f',
    padding: '1.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative'
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
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
    borderTop: '2px solid #a98a4f'
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
    border: '2px solid #a98a4f',
    fontFamily: "'Montserrat', sans-serif",
    textAlign: 'right'
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
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
  portfolioOutputBottom: {
    background: '#f5f2e9',
    border: '2px solid #d9d2c1',
    padding: '1rem 1.25rem',
    marginTop: '0.5rem',
    marginBottom: '1rem',
    fontSize: '0.95rem',
    color: '#2c2c2c'
  }
};

