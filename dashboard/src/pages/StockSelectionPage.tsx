import { useState } from 'react';
import { Config, Stock } from '../types/colt-road';
import { ALL_STOCKS } from '../utils/stockDatabase';
import { formatMarketCap } from '../utils/formatters';
import ProgressBar from '../components/ProgressBar';
import Section from '../components/Section';
import ButtonGroup from '../components/ButtonGroup';

interface StockSelectionPageProps {
  config: Config;
  toggleStock: (ticker: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StockSelectionPage({ config, toggleStock, onNext, onBack }: StockSelectionPageProps) {
  const [selectedIndex, setSelectedIndex] = useState<'SP500' | 'RUSSELL2000'>('SP500');
  const [sortBy, setSortBy] = useState<keyof Stock>('marketCap');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  
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
      <Section title="Stock Selection">
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
    color: '#6d6658'
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

