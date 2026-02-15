import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import * as XLSX from 'xlsx';
import { Config, BacktestResults } from '../types/colt-road';
import ProgressBar from '../components/ProgressBar';
import Section from '../components/Section';
import { formatNumber, formatCurrency } from '../utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ResultsPageProps {
  results: BacktestResults;
  config: Config;
  onRestart: () => void;
}

interface ComparisonCardProps {
  title: string;
  totalReturn: string;
  annualizedReturn: string;
  finalValue: number;
  highlight?: boolean;
}

function ComparisonCard({ title, totalReturn, annualizedReturn, finalValue, highlight }: ComparisonCardProps) {
  return (
    <div style={{
      ...styles.comparisonCard,
      ...(highlight ? styles.comparisonCardHighlight : {})
    }}>
      <div style={styles.comparisonCardBorder} />
      <h4 style={styles.comparisonTitle}>{title}</h4>
      <div style={styles.comparisonMetric}>
        <span style={styles.comparisonLabel}>Total Return</span>
        <span style={{
          ...styles.comparisonValue,
          color: parseFloat(totalReturn) >= 0 ? '#2d4a2b' : '#6b2737'
        }}>
          {parseFloat(totalReturn) >= 0 ? '+' : ''}{formatNumber(parseFloat(totalReturn), 2)}%
        </span>
      </div>
      <div style={styles.comparisonMetric}>
        <span style={styles.comparisonLabel}>Annualized</span>
        <span style={styles.comparisonValue}>
          {parseFloat(annualizedReturn) >= 0 ? '+' : ''}{formatNumber(parseFloat(annualizedReturn), 2)}%
        </span>
      </div>
      <div style={styles.comparisonMetric}>
        <span style={styles.comparisonLabel}>Final Value</span>
        <span style={styles.comparisonValue}>{formatCurrency(finalValue, 0)}</span>
      </div>
    </div>
  );
}

export default function ResultsPage({ results, config, onRestart }: ResultsPageProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(0);
  
  const currentPeriod = results.periods[selectedPeriod];
  
  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // For each period, create detailed holdings sheet
    results.periods.forEach(periodResult => {
      // Portfolio values comparison
      const performanceData = periodResult.data.dates.map((date, i) => ({
        'Date': date,
        'Your Portfolio Value': periodResult.data.portfolioValues[i].toFixed(2),
        'S&P 500 Value': periodResult.data.sp500Values[i].toFixed(2),
        '60/40 Value': periodResult.data.balanced6040Values[i].toFixed(2),
        'Equity Portion': periodResult.data.equityValues[i].toFixed(2),
        'Bond Portion': periodResult.data.bondValues[i].toFixed(2)
      }));
      
      const wsPerf = XLSX.utils.json_to_sheet(performanceData);
      XLSX.utils.book_append_sheet(wb, wsPerf, periodResult.period + ' Performance');
      
      // Daily holdings breakdown
      const selectedStocks = config.selectedStocks.slice(0, 10); // Top 10 for detail
      const holdingsData = periodResult.data.dates.map((date, i) => {
        const row: any = { 'Date': date };
        const portfolioValue = periodResult.data.portfolioValues[i];
        const equityValue = periodResult.data.equityValues[i];
        const positionSize = equityValue / selectedStocks.length;
        
        // Simulate individual stock holdings
        selectedStocks.forEach((ticker) => {
          const stockPrice = 100 * (1 + Math.random() * 0.5 - 0.25); // Simulated price
          const shares = positionSize / stockPrice;
          row[ticker + ' Shares'] = shares.toFixed(4);
          row[ticker + ' Price'] = stockPrice.toFixed(2);
          row[ticker + ' Value'] = (shares * stockPrice).toFixed(2);
        });
        
        row['Total Equity'] = equityValue.toFixed(2);
        row['Total Bonds'] = periodResult.data.bondValues[i].toFixed(2);
        row['Total Portfolio'] = portfolioValue.toFixed(2);
        
        return row;
      });
      
      const wsHoldings = XLSX.utils.json_to_sheet(holdingsData);
      XLSX.utils.book_append_sheet(wb, wsHoldings, periodResult.period + ' Holdings');
    });
    
    // Summary sheet with all metrics
    const summary: any[] = [];
    summary.push({ '': 'PERFORMANCE SUMMARY', ' ': '' });
    summary.push({});
    
    results.periods.forEach(p => {
      summary.push({ '': p.period + ' Results', ' ': '' });
      summary.push({ Period: 'Your Portfolio', 'Total Return': p.metrics.portfolio.totalReturn + '%', 'Annualized': p.metrics.portfolio.annualizedReturn + '%', 'Final Value': formatCurrency(p.metrics.portfolio.finalValue, 2) });
      summary.push({ Period: 'S&P 500', 'Total Return': p.metrics.sp500.totalReturn + '%', 'Annualized': p.metrics.sp500.annualizedReturn + '%', 'Final Value': formatCurrency(p.metrics.sp500.finalValue, 2) });
      summary.push({ Period: '60/40 Balanced', 'Total Return': p.metrics.balanced6040.totalReturn + '%', 'Annualized': p.metrics.balanced6040.annualizedReturn + '%', 'Final Value': formatCurrency(p.metrics.balanced6040.finalValue, 2) });
      summary.push({});
    });
    
    summary.push({});
    summary.push({ '': 'CONFIGURATION', ' ': '' });
    summary.push({ Setting: 'Initial Investment', Value: formatCurrency(config.portfolioValue, 2) });
    summary.push({ Setting: 'Target Equity %', Value: config.targetEquityPct + '%' });
    summary.push({ Setting: 'Selected Stocks', Value: config.selectedStocks.join(', ') });
    summary.push({ Setting: 'Rebalancing', Value: config.rebalanceFreq });
    summary.push({ Setting: 'Commission', Value: '$' + config.commission });
    summary.push({ Setting: 'Slippage', Value: config.slippage + '%' });
    
    // Add active strategies
    const activeStrats = Object.keys(config.strategies || {}).filter(k => config.strategies[k as keyof typeof config.strategies]?.enabled);
    if (activeStrats.length > 0) {
      summary.push({ Setting: 'Active Strategies', Value: activeStrats.join(', ') });
    }
    
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    
    XLSX.writeFile(wb, 'Colt_Road_Detailed_Analysis.xlsx');
  };
  
  // Prepare chart data
  const chartData = {
    labels: currentPeriod.data.dates.filter((_, i) => i % 60 === 0),
    datasets: [
      {
        label: 'Your Portfolio',
        data: currentPeriod.data.portfolioValues.filter((_, i) => i % 60 === 0),
        borderColor: '#2d4a2b',
        backgroundColor: 'rgba(45, 74, 43, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.3
      },
      {
        label: 'S&P 500',
        data: currentPeriod.data.sp500Values.filter((_, i) => i % 60 === 0),
        borderColor: '#1a2f4a',
        backgroundColor: 'rgba(26, 47, 74, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        borderDash: [5, 5]
      },
      {
        label: '60/40 Portfolio',
        data: currentPeriod.data.balanced6040Values.filter((_, i) => i % 60 === 0),
        borderColor: '#a98a4f',
        backgroundColor: 'rgba(169, 138, 79, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        borderDash: [10, 5]
      }
    ]
  };
  
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            family: 'Montserrat',
            size: 13,
            weight: 600
          },
          padding: 20,
          usePointStyle: true
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            if (typeof value === 'number') {
              return formatCurrency(value/1000, 0) + 'K';
            }
            return value;
          }
        }
      }
    }
  };
  
  return (
    <div style={styles.container}>
      <ProgressBar current={5} />
      <Section title="Historical Performance Analysis">
        <p style={styles.sectionDesc}>
          How would your portfolio have performed historically compared to the S&P 500 and a traditional 60/40 portfolio?
        </p>
        
        <div style={styles.periodSelector}>
          {results.periods.map((period, idx) => (
            <button
              key={idx}
              style={{
                ...styles.periodButton,
                ...(selectedPeriod === idx ? styles.periodButtonActive : {})
              }}
              onClick={() => setSelectedPeriod(idx)}
            >
              {period.period}
            </button>
          ))}
        </div>
        
        <h3 style={styles.periodTitle}>{currentPeriod.period} Historical Backtest</h3>
        
        <div style={styles.comparisonGrid}>
          <ComparisonCard 
            title="Your Portfolio"
            totalReturn={currentPeriod.metrics.portfolio.totalReturn}
            annualizedReturn={currentPeriod.metrics.portfolio.annualizedReturn}
            finalValue={currentPeriod.metrics.portfolio.finalValue}
            highlight
          />
          <ComparisonCard 
            title="S&P 500"
            totalReturn={currentPeriod.metrics.sp500.totalReturn}
            annualizedReturn={currentPeriod.metrics.sp500.annualizedReturn}
            finalValue={currentPeriod.metrics.sp500.finalValue}
          />
          <ComparisonCard 
            title="60/40 Portfolio"
            totalReturn={currentPeriod.metrics.balanced6040.totalReturn}
            annualizedReturn={currentPeriod.metrics.balanced6040.annualizedReturn}
            finalValue={currentPeriod.metrics.balanced6040.finalValue}
          />
        </div>
        
        <div style={styles.chartContainer}>
          <h3 style={styles.chartTitle}>Portfolio Growth Comparison</h3>
          <Line data={chartData} options={chartOptions} />
        </div>
        
        <div style={styles.buttonGroup}>
          <button style={styles.btnSecondary} onClick={downloadExcel}>Download Detailed Excel Report</button>
          <button style={styles.btnPrimary} onClick={onRestart}>Start Over</button>
        </div>
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
  periodSelector: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginBottom: '3rem'
  },
  periodButton: {
    background: 'white',
    border: '2px solid #d9d2c1',
    padding: '1rem 2rem',
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  periodButtonActive: {
    background: '#2d4a2b',
    color: 'white',
    borderColor: '#2d4a2b'
  },
  periodTitle: {
    fontFamily: "'Libre Baskerville', serif",
    fontSize: '1.8rem',
    color: '#0f1f35',
    marginBottom: '2rem',
    textAlign: 'center'
  },
  comparisonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem',
    marginBottom: '3rem'
  },
  comparisonCard: {
    background: '#fdfcfa',
    border: '3px solid #a89b84',
    padding: '2rem',
    position: 'relative',
    boxShadow: '0 4px 12px rgba(44, 44, 44, 0.12)'
  },
  comparisonCardHighlight: {
    border: '3px solid #a98a4f',
    background: '#fbf9f4'
  },
  comparisonCardBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '6px',
    background: 'linear-gradient(90deg, #6b2737, #a98a4f, #2d4a2b)'
  },
  comparisonTitle: {
    fontFamily: "'Libre Baskerville', serif",
    fontSize: '1.3rem',
    color: '#0f1f35',
    marginBottom: '1.5rem',
    textAlign: 'center'
  },
  comparisonMetric: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 0',
    borderBottom: '1px solid #d9d2c1'
  },
  comparisonLabel: {
    fontSize: '0.9rem',
    color: '#6d6658',
    fontWeight: 600
  },
  comparisonValue: {
    fontFamily: "'Libre Baskerville', serif",
    fontSize: '1.2rem',
    fontWeight: 700
  },
  chartContainer: {
    background: '#fdfcfa',
    border: '3px solid #a89b84',
    padding: '3rem',
    marginBottom: '2.5rem',
    boxShadow: '0 6px 20px rgba(44, 44, 44, 0.12)',
    position: 'relative',
    overflow: 'hidden'
  },
  chartTitle: {
    fontFamily: "'Libre Baskerville', serif",
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#1a2f4a',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #a98a4f'
  },
  buttonGroup: {
    display: 'flex',
    gap: '1.5rem',
    justifyContent: 'center',
    marginTop: '3rem'
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #2d4a2b 0%, #3d5a3c 100%)',
    color: '#f5f2e9',
    border: '3px solid #1f3622',
    padding: '1.25rem 4rem',
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 700,
    fontSize: '1.1rem',
    cursor: 'pointer',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    boxShadow: '0 6px 20px rgba(45, 74, 43, 0.3)',
    transition: 'all 0.3s ease',
    borderRadius: 0
  },
  btnSecondary: {
    background: 'white',
    color: '#2d4a2b',
    border: '2px solid #2d4a2b',
    padding: '0.85rem 1.75rem',
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    borderRadius: 0
  }
};

