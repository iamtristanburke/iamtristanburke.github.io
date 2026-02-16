import { useState } from 'react';
import { Config, Stock, InvestmentStyle } from '../types/colt-road';
import { ALL_STOCKS } from '../utils/stockDatabase';
import { formatMarketCap } from '../utils/formatters';
import ProgressBar from '../components/ProgressBar';
import Section from '../components/Section';
import ButtonGroup from '../components/ButtonGroup';

const THEME_OPTIONS = ['Technology', 'Healthcare', 'Dividend / Income', 'ESG', 'Growth', 'Value', 'Defensive', 'Cyclical', 'International'];

interface StockSelectionPageProps {
  config: Config;
  updateConfig: (key: keyof Config, value: any) => void;
  toggleStock: (ticker: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StockSelectionPage({ config, updateConfig, toggleStock, onNext, onBack }: StockSelectionPageProps) {
  const [selectedIndex, setSelectedIndex] = useState<'SP500' | 'RUSSELL2000'>('SP500');
  const [sortBy, setSortBy] = useState<keyof Stock>('marketCap');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const investmentStyle = config.investmentStyle ?? 'balanced';
  const themes = config.themes ?? [];
  const buySignals = config.buySignals ?? { technical: true, fundamental: true, ai: false };

  const toggleTheme = (theme: string) => {
    const next = themes.includes(theme) ? themes.filter(t => t !== theme) : [...themes, theme];
    updateConfig('themes', next);
  };

  const setBuySignal = (key: keyof typeof buySignals, value: boolean) => {
    updateConfig('buySignals', { ...buySignals, [key]: value });
  };
  
  const filteredStocks = ALL_STOCKS.filter(stock => stock.index === selectedIndex);
  
  const sortedStocks = [...filteredStocks].sort((a, b) => {
    let aVal: any = a[sortBy];
    let bVal: any = b[sortBy];
    
    if (sortBy === 'marketCap' || sortBy === 'pe') {
      aVal = parseFloat(aVal.toString());
      bVal = parseFloat(bVal.toString());
    }
    
    if (sortDir === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
  
  const handleSort = (column: keyof Stock) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };
  
  const selectAll = () => {
    sortedStocks.forEach(stock => {
      if (!config.selectedStocks.includes(stock.ticker)) {
        toggleStock(stock.ticker);
      }
    });
  };
  
  const deselectAll = () => {
    sortedStocks.forEach(stock => {
      if (config.selectedStocks.includes(stock.ticker)) {
        toggleStock(stock.ticker);
      }
    });
  };
  
  return (
    <div style={styles.container} className="page-container">
      <ProgressBar current={3} />
      <Section title="2. What stocks should you be buying?">
        <p style={styles.sectionDesc}>
          Define your investment style, themes you care about, and what signals (technical, fundamental, or AI-based) should drive buy decisions. Then choose the stocks in your universe.
        </p>

        <h3 style={styles.subsectionTitle}>Investment style</h3>
        <div style={styles.optionRow}>
          {(['growth', 'income', 'balanced'] as InvestmentStyle[]).map(style => (
            <label key={style} style={styles.radioLabel}>
              <input
                type="radio"
                name="investmentStyle"
                checked={investmentStyle === style}
                onChange={() => updateConfig('investmentStyle', style)}
                style={styles.radio}
              />
              <span style={{ textTransform: 'capitalize' }}>{style}</span>
            </label>
          ))}
        </div>

        <h3 style={styles.subsectionTitle}>Themes / industries</h3>
        <p style={styles.hint}>Select any themes or industries you're interested in. AI can use these to focus recommendations.</p>
        <div style={styles.themeGrid}>
          {THEME_OPTIONS.map(theme => (
            <label
              key={theme}
              style={{
                ...styles.themeChip,
                ...(themes.includes(theme) ? styles.themeChipSelected : {})
              }}
            >
              <input
                type="checkbox"
                checked={themes.includes(theme)}
                onChange={() => toggleTheme(theme)}
                style={styles.checkbox}
              />
              {theme}
            </label>
          ))}
        </div>

        <h3 style={styles.subsectionTitle}>Buy signals</h3>
        <p style={styles.hint}>What should drive a &quot;buy&quot; decision? Traditional technical/fundamental and/or AI-based signals.</p>
        <div style={styles.optionRow}>
          <label style={styles.checkLabel}>
            <input type="checkbox" checked={buySignals.technical} onChange={(e) => setBuySignal('technical', e.target.checked)} style={styles.checkbox} />
            Technical analysis
          </label>
          <label style={styles.checkLabel}>
            <input type="checkbox" checked={buySignals.fundamental} onChange={(e) => setBuySignal('fundamental', e.target.checked)} style={styles.checkbox} />
            Fundamental data
          </label>
          <label style={styles.checkLabel}>
            <input type="checkbox" checked={buySignals.ai} onChange={(e) => setBuySignal('ai', e.target.checked)} style={styles.checkbox} />
            AI / non-traditional signals
          </label>
        </div>

        <h3 style={styles.subsectionTitle}>Your stock universe</h3>
        <p style={styles.sectionDesc}>Select stocks for your equity allocation. Key fundamental metrics are shown below.</p>
        
        <div style={styles.filterBar} className="filter-bar">
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Index:</label>
            <select value={selectedIndex} onChange={(e) => setSelectedIndex(e.target.value as 'SP500' | 'RUSSELL2000')} style={styles.filterSelect}>
              <option value="SP500">S&P 500</option>
              <option value="RUSSELL2000">Russell 2000</option>
            </select>
          </div>
          
          <div style={styles.filterGroup}>
            <button style={styles.btnSmall} onClick={selectAll}>Select All</button>
            <button style={styles.btnSmall} onClick={deselectAll}>Deselect All</button>
          </div>
        </div>
        
        <div style={styles.tableWrapper} className="table-wrapper">
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Select</th>
                <th style={styles.th}>Ticker</th>
                <th style={styles.th}>Company</th>
                <th style={{...styles.th, cursor: 'pointer'}} onClick={() => handleSort('marketCap')}>
                  Market Cap {sortBy === 'marketCap' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{...styles.th, cursor: 'pointer'}} onClick={() => handleSort('pe')}>
                  P/E Ratio {sortBy === 'pe' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th style={styles.th}>Div Yield</th>
                <th style={{...styles.th, cursor: 'pointer'}} onClick={() => handleSort('sector')}>
                  Sector {sortBy === 'sector' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStocks.map(stock => (
                <tr key={stock.ticker} style={styles.tableRow}>
                  <td style={styles.td}>
                    <input 
                      type="checkbox" 
                      checked={config.selectedStocks.includes(stock.ticker)}
                      onChange={() => toggleStock(stock.ticker)}
                      style={styles.checkbox}
                    />
                  </td>
                  <td style={{...styles.td, fontWeight: '700'}}>{stock.ticker}</td>
                  <td style={styles.td}>{stock.name}</td>
                  <td style={styles.td}>{formatMarketCap(stock.marketCap)}</td>
                  <td style={styles.td}>{stock.pe.toFixed(1)}</td>
                  <td style={styles.td}>{stock.divYield.toFixed(1)}%</td>
                  <td style={styles.td}>{stock.sector}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{marginTop: '1rem', color: '#6d6658'}}>
          <strong>{config.selectedStocks.length}</strong> stocks selected
        </div>
        <ButtonGroup onBack={onBack} onNext={onNext} nextLabel="Continue to Strategy" />
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
    fontFamily: "'Libre Baskerville', serif",
    fontSize: '1.35rem',
    color: '#0f1f35',
    marginTop: '2rem',
    marginBottom: '0.75rem',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #d9d2c1'
  },
  hint: {
    fontSize: '0.9rem',
    color: '#6d6658',
    marginBottom: '1rem'
  },
  optionRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1.5rem',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontWeight: 600,
    color: '#2c2c2c'
  },
  radio: {
    width: '18px',
    height: '18px',
    accentColor: '#2d4a2b',
    cursor: 'pointer'
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontWeight: 600,
    color: '#2c2c2c'
  },
  themeGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    marginBottom: '1.5rem'
  },
  themeChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: '#f5f2e9',
    border: '2px solid #d9d2c1',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500
  },
  themeChipSelected: {
    borderColor: '#2d4a2b',
    background: 'rgba(45, 74, 43, 0.1)'
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    background: '#f5f2e9',
    border: '2px solid #d9d2c1',
    marginTop: '1rem'
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  filterLabel: {
    fontWeight: 600,
    color: '#2c2c2c'
  },
  filterSelect: {
    background: 'white',
    border: '2px solid #d9d2c1',
    padding: '0.5rem 1rem',
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '0.9rem'
  },
  btnSmall: {
    background: 'white',
    border: '2px solid #2d4a2b',
    padding: '0.5rem 1rem',
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
    color: '#2d4a2b',
    transition: 'all 0.2s'
  },
  tableWrapper: {
    maxHeight: '500px',
    overflowY: 'auto',
    marginTop: '2rem',
    border: '2px solid #d9d2c1'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    background: '#f5f2e9'
  },
  th: {
    padding: '1rem',
    textAlign: 'left',
    fontWeight: 700,
    textTransform: 'uppercase',
    fontSize: '0.8rem',
    letterSpacing: '0.05em',
    color: '#2d4a2b',
    borderBottom: '2px solid #d9d2c1'
  },
  tableRow: {
    borderBottom: '1px solid #d9d2c1'
  },
  td: {
    padding: '1rem'
  },
  checkbox: {
    width: '20px',
    height: '20px',
    accentColor: '#2d4a2b',
    cursor: 'pointer'
  }
};

