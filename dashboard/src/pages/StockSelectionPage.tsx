import { useState, useEffect } from 'react';
import { Config, Stock } from '../types/colt-road';
import { ALL_STOCKS } from '../utils/stockDatabase';
import { formatMarketCap } from '../utils/formatters';
import { filterStocksWithLLM, isLLMApiConfigured } from '../services/llmStockFilter';
import ProgressBar from '../components/ProgressBar';
import Section from '../components/Section';
import ButtonGroup from '../components/ButtonGroup';
import StockDetailPanel from '../components/StockDetailPanel';
import { COLT_ROAD_BEST_IDEAS } from '../data/coltRoadBestIdeas';

const COLT_ICON = '/colt-icon.png?v=2';

interface StockSelectionPageProps {
  config: Config;
  updateConfig: (key: keyof Config, value: any) => void;
  toggleStock: (ticker: string) => void;
  onNext: () => void;
  onBack: () => void;
  onStepClick?: (step: number) => void;
  onOpenResearch?: () => void;
}

export default function StockSelectionPage({ config, updateConfig: _updateConfig, toggleStock, onNext, onBack, onStepClick, onOpenResearch }: StockSelectionPageProps) {
  const [sortBy, setSortBy] = useState<keyof Stock>('marketCap');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [llmQuery, setLlmQuery] = useState('');
  const [llmFilteredTickers, setLlmFilteredTickers] = useState<string[] | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [, setConfigVersion] = useState(0);

  useEffect(() => {
    const onConfigSaved = () => setConfigVersion((v) => v + 1);
    window.addEventListener('colt-road-api-config-saved', onConfigSaved);
    return () => window.removeEventListener('colt-road-api-config-saved', onConfigSaved);
  }, []);

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
    const key = sortBy;
    let aVal: string | number = a[key] as string | number;
    let bVal: string | number = b[key] as string | number;
    const numericKeys: (keyof Stock)[] = ['marketCap', 'pe', 'divYield', 'revenueGrowth3y'];
    if (numericKeys.includes(key)) {
      const aNum = Number(aVal) || 0;
      const bNum = Number(bVal) || 0;
      const out = aNum < bNum ? -1 : aNum > bNum ? 1 : 0;
      return sortDir === 'asc' ? out : -out;
    }
    const aStr = String(aVal ?? '').toLowerCase();
    const bStr = String(bVal ?? '').toLowerCase();
    const cmp = aStr.localeCompare(bStr, undefined, { sensitivity: 'base' });
    return sortDir === 'asc' ? cmp : -cmp;
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
        <div style={styles.perspectiveHeadingRow}>
          <div style={styles.coltIconWrap}>
            <img src={COLT_ICON} alt="" style={styles.coltIconWhite} aria-hidden />
          </div>
          <h3 style={styles.subsectionTitle}>Colt Road&apos;s Perspective</h3>
        </div>
        <p style={styles.perspectiveParagraph}>
          We buy <strong>cheap, profitable</strong> companies inside <strong>secular growth themes Colt Road&apos;s AI has identified as being the most relevant for the next 5–10 years+</strong>—not value traps in dying industries. Our universe: AI Physical Infrastructure, Silver Economy, Industrial Reshoring. Every name must pass a strict gate (Piotroski F-Score ≥7, ROIC &gt; WACC, Shareholder Yield &gt; 0), then we rank by Value (40%), Quality (40%), and Yield (20%). The result is Colt Road&apos;s 15 Best Ideas—listed and auto-selected below.
        </p>
        {onOpenResearch && (
          <button type="button" onClick={onOpenResearch} style={styles.researchBtn}>
            Colt Road&apos;s Research on Stock Picking
          </button>
        )}
        <p style={styles.bestIdeasLabel}>Colt Road&apos;s 15 Best Ideas</p>
        <p style={styles.bestIdeasSubtext}>S&amp;P 500 names that best fit the Structural Alpha methodology (thematic universe + quality/value/yield). Same list appears in Colt Road&apos;s Research on Stock Picking.</p>
        <ol style={styles.bestIdeasList} start={1}>
          {COLT_ROAD_BEST_IDEAS.map(({ ticker, name, theme }) => (
            <li key={ticker} style={styles.bestIdeasItem}>
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
        </ol>

        <h3 style={styles.subsectionTitleStandalone}>Your stock universe</h3>
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
            {!isLLMApiConfigured() && ' (Keyword match. Use Configure in the header for full AI filtering.)'}
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
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('ticker')}>
                  Ticker {sortBy === 'ticker' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('name')}>
                  Company {sortBy === 'name' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('marketCap')}>
                  Market Cap {sortBy === 'marketCap' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('pe')}>
                  P/E Ratio {sortBy === 'pe' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('divYield')}>
                  Div Yield {sortBy === 'divYield' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('revenueGrowth3y')}>
                  3Y Rev Growth {sortBy === 'revenueGrowth3y' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('sector')}>
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
                  <td style={styles.td}>{stock.pe > 0 ? stock.pe.toFixed(1) : '—'}</td>
                  <td style={styles.td}>{stock.divYield.toFixed(1)}%</td>
                  <td style={styles.td}>
                    {stock.revenueGrowth3y != null && Number.isFinite(stock.revenueGrowth3y)
                      ? `${stock.revenueGrowth3y.toFixed(1)}%`
                      : '—'}
                  </td>
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
  subsectionTitle: {
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '1.35rem',
    color: '#0f1f35',
    margin: 0,
    paddingBottom: 0
  },
  subsectionTitleStandalone: {
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
  bestIdeasLabel: {
    margin: '0 0 0.5rem 0',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#6d6658',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  bestIdeasSubtext: {
    fontSize: '0.85rem',
    color: '#6d6658',
    marginBottom: '0.5rem',
    lineHeight: 1.45
  },
  bestIdeasList: {
    margin: '0 0 1.5rem 0',
    paddingLeft: '1.5rem',
    maxWidth: '720px',
    listStyleType: 'decimal'
  },
  bestIdeasItem: {
    fontSize: '0.95rem',
    color: '#2c2c2c',
    lineHeight: 1.6,
    marginBottom: '0.35rem'
  },
  bestIdeasTicker: {
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

