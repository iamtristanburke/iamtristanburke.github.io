import { useState } from 'react';
import { Config, Stock } from '../types/colt-road';
import { ALL_STOCKS } from '../utils/stockDatabase';
import { formatMarketCap } from '../utils/formatters';
import { filterStocksWithLLM, isLLMApiConfigured } from '../services/llmStockFilter';
import ProgressBar from '../components/ProgressBar';
import Section from '../components/Section';
import ButtonGroup from '../components/ButtonGroup';
import StockDetailPanel from '../components/StockDetailPanel';

/** Illustrative S&P 500 ideas from Colt Road (thematic examples, not recommendations). */
const ILLUSTRATIVE_IDEAS: { ticker: string; name: string; theme: string }[] = [
  { ticker: 'MSFT', name: 'Microsoft', theme: 'Quality growth, durable earnings visibility' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', theme: 'Dividend grower, healthcare quality' },
  { ticker: 'XOM', name: 'ExxonMobil', theme: 'Energy, dividend and balance-sheet strength' },
  { ticker: 'CAT', name: 'Caterpillar', theme: 'Cyclical with pricing power' },
  { ticker: 'UNH', name: 'UnitedHealth Group', theme: 'Healthcare, earnings visibility' },
  { ticker: 'PG', name: 'Procter & Gamble', theme: 'Defensive dividend, pricing power' },
  { ticker: 'ABBV', name: 'AbbVie', theme: 'Dividend resilience, healthcare' },
  { ticker: 'CVX', name: 'Chevron', theme: 'Energy, traditional and transition' }
];

interface StockSelectionPageProps {
  config: Config;
  updateConfig: (key: keyof Config, value: any) => void;
  toggleStock: (ticker: string) => void;
  onNext: () => void;
  onBack: () => void;
  onStepClick?: (step: number) => void;
}

export default function StockSelectionPage({ config, updateConfig: _updateConfig, toggleStock, onNext, onBack, onStepClick }: StockSelectionPageProps) {
  const [sortBy, setSortBy] = useState<keyof Stock>('marketCap');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [llmQuery, setLlmQuery] = useState('');
  const [llmFilteredTickers, setLlmFilteredTickers] = useState<string[] | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  const openStockDetail = (ticker: string) => {
    const stock = ALL_STOCKS.find((s) => s.ticker === ticker);
    if (stock) setSelectedStock(stock);
  };

  const runLlmFilter = async () => {
    if (!llmQuery.trim()) {
      setLlmFilteredTickers(null);
      return;
    }
    setLlmLoading(true);
    try {
      const tickers = await filterStocksWithLLM(llmQuery.trim(), ALL_STOCKS);
      setLlmFilteredTickers(tickers);
    } finally {
      setLlmLoading(false);
    }
  };

  const clearLlmFilter = () => {
    setLlmQuery('');
    setLlmFilteredTickers(null);
  };

  const filteredStocks =
    llmFilteredTickers === null
      ? ALL_STOCKS
      : ALL_STOCKS.filter((s) => llmFilteredTickers.includes(s.ticker));
  
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
      {selectedStock && (
        <StockDetailPanel stock={selectedStock} onClose={() => setSelectedStock(null)} />
      )}
      <ProgressBar current={3} onStepClick={onStepClick} />
      <Section title="2. What stocks should you be buying?">
        <h3 style={styles.subsectionTitle}>Colt Road&apos;s Perspective</h3>
        <p style={styles.perspectiveParagraph}>
          Colt Road is monitoring themes around rates and duration, quality in technology and health care, energy transition and traditional energy, and dividend resilience in a higher-for-longer environment. Right now we find selective quality growth (earnings visibility and balance-sheet strength), dividend payers with room to grow, and certain cyclicals with pricing power more interesting than broad momentum or speculative growth. Use the search below to narrow the universe to what fits your view.
        </p>
        <p style={styles.illustrativeLabel}>Illustrative ideas from Colt Road (S&P 500)</p>
        <ul style={styles.illustrativeList}>
          {ILLUSTRATIVE_IDEAS.map(({ ticker, name, theme }) => (
            <li key={ticker} style={styles.illustrativeItem}>
              {name} (
              <button
                type="button"
                onClick={() => openStockDetail(ticker)}
                style={styles.tickerLink}
              >
                {ticker}
              </button>
              ): {theme}
            </li>
          ))}
        </ul>

        <h3 style={styles.subsectionTitle}>Your stock universe</h3>
        <p style={styles.sectionDesc}>Select stocks for your equity allocation. Describe the kind of stocks you want below; Colt Road will filter the list to match.</p>

        <div style={styles.llmSearchBar}>
          <input
            type="text"
            value={llmQuery}
            onChange={(e) => setLlmQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runLlmFilter()}
            placeholder="e.g. energy stocks with good growth this year"
            style={styles.llmSearchInput}
            disabled={llmLoading}
          />
          <button
            type="button"
            onClick={runLlmFilter}
            disabled={llmLoading}
            style={{ ...styles.llmSearchBtn, ...(llmLoading ? styles.llmSearchBtnDisabled : {}) }}
          >
            {llmLoading ? 'Searching…' : 'Filter stocks'}
          </button>
          {(llmFilteredTickers !== null || llmQuery.trim()) && (
            <button type="button" onClick={clearLlmFilter} style={styles.llmClearBtn}>
              Show all
            </button>
          )}
        </div>
        {llmFilteredTickers !== null && (
          <p style={styles.llmResultHint}>
            Showing {llmFilteredTickers.length} stocks matching your description.
            {!isLLMApiConfigured() && ' (Keyword match. Set VITE_LLM_FILTER_API_URL for full AI filtering.)'}
          </p>
        )}

        <div style={styles.tableActions}>
          <button style={styles.btnSmall} onClick={selectAll}>Select all visible</button>
          <button style={styles.btnSmall} onClick={deselectAll}>Deselect all visible</button>
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
                  <td style={styles.td}>
                  <button
                    type="button"
                    onClick={() => openStockDetail(stock.ticker)}
                    style={styles.tickerLink}
                  >
                    {stock.ticker}
                  </button>
                </td>
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
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '1.35rem',
    color: '#0f1f35',
    marginTop: '2rem',
    marginBottom: '0.75rem',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #d9d2c1'
  },
  perspectiveParagraph: {
    margin: '0 0 1.5rem 0',
    fontSize: '0.95rem',
    color: '#2c2c2c',
    lineHeight: 1.65,
    maxWidth: '720px'
  },
  illustrativeLabel: {
    margin: '0 0 0.5rem 0',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#6d6658',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  illustrativeList: {
    margin: '0 0 1.5rem 0',
    paddingLeft: '1.25rem',
    maxWidth: '720px'
  },
  illustrativeItem: {
    fontSize: '0.95rem',
    color: '#2c2c2c',
    lineHeight: 1.6,
    marginBottom: '0.35rem'
  },
  illustrativeTicker: {
    color: '#0f1f35',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  tickerLink: {
    background: 'none',
    border: 'none',
    padding: 0,
    font: 'inherit',
    fontWeight: 700,
    color: '#2d4a2b',
    cursor: 'pointer',
    textDecoration: 'underline',
    textDecorationColor: 'rgba(45, 74, 43, 0.5)'
  },
  llmSearchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
    marginTop: '0.5rem',
    marginBottom: '0.5rem'
  },
  llmSearchInput: {
    flex: '1 1 320px',
    minWidth: 0,
    padding: '0.75rem 1rem',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '1rem',
    border: '2px solid #d9d2c1',
    background: '#fff',
    color: '#0f1f35'
  },
  llmSearchBtn: {
    padding: '0.75rem 1.25rem',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '0.95rem',
    fontWeight: 600,
    background: '#2d4a2b',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  llmSearchBtnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed'
  },
  llmClearBtn: {
    padding: '0.75rem 1rem',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '0.9rem',
    background: 'transparent',
    color: '#6d6658',
    border: '1px solid #d9d2c1',
    cursor: 'pointer'
  },
  llmResultHint: {
    margin: '0 0 1rem 0',
    fontSize: '0.9rem',
    color: '#6d6658'
  },
  tableActions: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.5rem',
    marginBottom: '0.5rem'
  },
  btnSmall: {
    background: 'white',
    border: '2px solid #2d4a2b',
    padding: '0.5rem 1rem',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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

