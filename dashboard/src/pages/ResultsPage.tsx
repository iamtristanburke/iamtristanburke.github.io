import { useState, useMemo } from 'react';
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
import { Config, BacktestResults, TradingStrategyId, TRADING_STRATEGY_DISPLAY_NAMES } from '../types/colt-road';
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
  onStepClick?: (step: number) => void;
}

interface ComparisonCardProps {
  title: string;
  totalReturn: string;
  annualizedReturn: string;
  finalValue: number;
  highlight?: boolean;
}

interface BearMarketWindow {
  label: string;
  peakDate: string;
  troughDate: string;
  durationLabel: string;
}

const DISPLAY_DATE = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

function formatBearDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(d.getTime()) ? dateStr : DISPLAY_DATE.format(d);
}

function formatPctCell(value: number | null, decimals: number = 1): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const abs = formatNumber(Math.abs(value), decimals);
  return value < 0 ? `(${abs}%)` : `${abs}%`;
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

const STRATEGY_IDS: TradingStrategyId[] = ['buyAndHold', 'momentum', 'meanReversion', 'movingAverage', 'breakout', 'contrarian', 'technical'];
const BEAR_MARKETS: BearMarketWindow[] = [
  {
    label: 'COVID-19 Crash (2020)',
    peakDate: '2020-02-19',
    troughDate: '2020-03-23',
    durationLabel: '~1 month'
  },
  {
    label: 'Inflation & Rate Shock (2022)',
    peakDate: '2022-01-03',
    troughDate: '2022-10-12',
    durationLabel: '~9 months'
  }
];

export default function ResultsPage({ results, config, onRestart, onStepClick }: ResultsPageProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(0);
  
  const currentPeriod = results.periods[selectedPeriod];
  const activeStrategyName = TRADING_STRATEGY_DISPLAY_NAMES[
    STRATEGY_IDS.find((id) => config.strategies?.[id]?.enabled) ?? 'buyAndHold'
  ];
  
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
  
  // Prepare chart data and options once per period so the chart doesn't reflow or resize
  const { chartData, chartOptions } = useMemo(() => {
    const dates = currentPeriod.data.dates;
    const n = dates.length;
    const chartIndices = n <= 0 ? [] : (() => {
      const every = Math.max(1, Math.floor(n / 80));
      const indices: number[] = [];
      for (let i = 0; i < n; i += every) indices.push(i);
      if (n > 0 && indices[indices.length - 1] !== n - 1) indices.push(n - 1);
      return indices;
    })();

    const portfolio = chartIndices.map((i) => currentPeriod.data.portfolioValues[i]);
    const sp500 = chartIndices.map((i) => currentPeriod.data.sp500Values[i]);
    const balanced = chartIndices.map((i) => currentPeriod.data.balanced6040Values[i]);
    const allValues = [...portfolio, ...sp500, ...balanced].filter((v) => typeof v === 'number');
    const dataMin = allValues.length ? Math.min(...allValues) : 0;
    const dataMax = allValues.length ? Math.max(...allValues) : 1;
    const paddedMin = Math.max(0, dataMin * 0.95);
    const paddedMax = dataMax * 1.05;
    const span = Math.max(1, paddedMax - paddedMin);
    // Choose a stable "nice" step and snap min/max to it so tick spacing is uniform.
    const roughStep = span / 6;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalized = roughStep / magnitude;
    const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    const yStep = niceNormalized * magnitude;
    const yMin = Math.floor(paddedMin / yStep) * yStep;
    const yMax = Math.ceil(paddedMax / yStep) * yStep;

    const data = {
      labels: chartIndices.map((i) => dates[i]),
      datasets: [
        {
          label: 'Your Portfolio',
          data: portfolio,
          borderColor: '#2d4a2b',
          backgroundColor: 'rgba(45, 74, 43, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.3
        },
        {
          label: 'S&P 500',
          data: sp500,
          borderColor: '#1a2f4a',
          backgroundColor: 'rgba(26, 47, 74, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          borderDash: [5, 5]
        },
        {
          label: '60/40 Portfolio',
          data: balanced,
          borderColor: '#a98a4f',
          backgroundColor: 'rgba(169, 138, 79, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          borderDash: [10, 5]
        }
      ]
    };

    const options: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { family: 'Cormorant Garamond', size: 13, weight: 600 },
            padding: 20,
            usePointStyle: true
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: { display: false }
        },
        y: {
          min: yMin,
          max: yMax,
          grid: { color: 'rgba(168, 155, 132, 0.25)' },
          ticks: {
            stepSize: yStep,
            callback(this: unknown, value: string | number) {
              if (typeof value === 'number') return formatCurrency(value / 1000, 0) + 'K';
              return value;
            }
          }
        }
      }
    };

    return { chartData: data, chartOptions: options };
  }, [currentPeriod, selectedPeriod]);

  const bearMarketRows = useMemo(() => {
    const { dates, portfolioValues, sp500Values, balanced6040Values } = currentPeriod.data;

    const getValueOnOrBefore = (targetDate: string, values: number[]) => {
      for (let i = dates.length - 1; i >= 0; i--) {
        if (dates[i] <= targetDate) return values[i];
      }
      return null;
    };

    const calcReturnPct = (peak: number | null, trough: number | null) => {
      if (peak == null || trough == null || peak <= 0) return null;
      return ((trough - peak) / peak) * 100;
    };

    return BEAR_MARKETS.map((mkt) => {
      const portPeak = getValueOnOrBefore(mkt.peakDate, portfolioValues);
      const portTrough = getValueOnOrBefore(mkt.troughDate, portfolioValues);
      const spPeak = getValueOnOrBefore(mkt.peakDate, sp500Values);
      const spTrough = getValueOnOrBefore(mkt.troughDate, sp500Values);
      const balPeak = getValueOnOrBefore(mkt.peakDate, balanced6040Values);
      const balTrough = getValueOnOrBefore(mkt.troughDate, balanced6040Values);

      return {
        ...mkt,
        portfolioReturnPct: calcReturnPct(portPeak, portTrough),
        sp500ReturnPct: calcReturnPct(spPeak, spTrough),
        balancedReturnPct: calcReturnPct(balPeak, balTrough)
      };
    });
  }, [currentPeriod]);
  
  return (
    <div style={styles.container} className="page-container">
      <ProgressBar current={5} onStepClick={onStepClick} />
      <Section title="Your Results">
        <h3 style={styles.historicalSectionTitle}>Historical Performance Analysis</h3>
        <p style={styles.sectionDesc}>
          Based on your debt/equity allocation, stock universe, and balance rules, here is how your portfolio would have performed historically compared to the S&P 500 and a traditional 60/40 portfolio.
          {results.lastUpdated && (
            <> All returns and prices in this backtest are derived from actual security data (S&P 500, selected equities, and aggregate bonds). <strong>Data as of {results.lastUpdated}</strong>. Trading strategy applied retroactively: <strong>{activeStrategyName}</strong>.</>
          )}
        </p>
        
        <div style={styles.periodSelector} className="period-selector">
          {results.periods.map((period, idx) => (
            <button
              key={idx}
              style={{
                ...styles.periodButton,
                ...(selectedPeriod === idx ? styles.periodButtonActive : {})
              }}
              className="period-button"
              onClick={() => setSelectedPeriod(idx)}
            >
              {period.period}
            </button>
          ))}
        </div>
        
        <h3 style={styles.periodTitle}>{currentPeriod.period} Historical Backtest</h3>
        
        <div style={styles.comparisonGrid} className="comparison-grid">
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
        
        <div style={styles.chartContainer} className="chart-container">
          <h3 style={styles.chartTitle}>Portfolio Growth Comparison</h3>
          <div style={styles.chartWrapper}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {results.strategyComparison && results.strategyComparison.length > 0 && (() => {
          const comparison = results.strategyComparison!;
          const periodLabels = results.periods.map(p => p.period);
          const buyAndHold = comparison.find(s => s.strategyId === 'buyAndHold');
          const sorted = [...comparison].sort((a, b) => {
            const lastPeriod = periodLabels[periodLabels.length - 1];
            return (b.annualizedReturnByPeriod[lastPeriod] || 0) - (a.annualizedReturnByPeriod[lastPeriod] || 0);
          });
          const bestByPeriod: Record<string, number> = {};
          for (const label of periodLabels) {
            bestByPeriod[label] = Math.max(...comparison.map(s => s.annualizedReturnByPeriod[label] || -Infinity));
          }
          return (
            <>
              <h3 style={styles.historicalSectionTitle}>Optimal Trading Strategy for This Portfolio</h3>
              <p style={styles.sectionDesc}>
                Each trading strategy was backtested against your specific stock selection, allocation, and execution parameters. Annualized returns shown below; the best performer in each period is highlighted. Delta columns show difference versus Buy and Hold.
              </p>
              <div style={styles.bearTableWrap}>
                <table style={styles.bearTable}>
                  <thead>
                    <tr style={styles.bearTableHeader}>
                      <th style={styles.bearTh}>Strategy</th>
                      {periodLabels.map(label => (
                        <th key={label} style={{ ...styles.bearTh, ...styles.bearRight, minWidth: '90px' }}>{label}</th>
                      ))}
                      {periodLabels.map(label => (
                        <th key={`d-${label}`} style={{ ...styles.bearTh, ...styles.bearRight, minWidth: '80px' }}>vs B&amp;H ({label.replace('-Year', 'Y')})</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map(entry => {
                      const isActive = config.strategies?.[entry.strategyId]?.enabled;
                      return (
                        <tr key={entry.strategyId} style={{ ...styles.bearRow, ...(isActive ? { background: 'rgba(45, 74, 43, 0.08)' } : {}) }}>
                          <td style={{ ...styles.bearTd, fontWeight: isActive ? 700 : 400 }}>
                            {entry.strategyName}{isActive ? ' ✦' : ''}
                          </td>
                          {periodLabels.map(label => {
                            const val = entry.annualizedReturnByPeriod[label];
                            const isBest = !isNaN(val) && val === bestByPeriod[label];
                            return (
                              <td key={label} style={{ ...styles.bearTd, ...styles.bearRight, ...(isBest ? { color: '#2d4a2b', fontWeight: 700 } : {}) }}>
                                {isNaN(val) ? '—' : `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`}
                              </td>
                            );
                          })}
                          {periodLabels.map(label => {
                            const val = entry.annualizedReturnByPeriod[label];
                            const bhVal = buyAndHold?.annualizedReturnByPeriod[label];
                            if (isNaN(val) || bhVal == null || isNaN(bhVal)) return <td key={`d-${label}`} style={{ ...styles.bearTd, ...styles.bearRight }}>—</td>;
                            const delta = val - bhVal;
                            return (
                              <td key={`d-${label}`} style={{ ...styles.bearTd, ...styles.bearRight, color: delta >= 0 ? '#2d4a2b' : '#8b1a1a', fontWeight: 700 }}>
                                {delta >= 0 ? '+' : ''}{delta.toFixed(2)}%
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p style={{ ...styles.sectionDesc, marginTop: '0.5rem', fontSize: '0.85rem' }}>
                ✦ = your selected strategy. Strategies are ranked by longest-period annualized return.
              </p>
            </>
          );
        })()}

        <h3 style={styles.historicalSectionTitle}>Bear Market Comparison (Peak to Trough)</h3>
        <p style={styles.sectionDesc}>
          Peak-to-trough performance for your portfolio versus S&amp;P 500 and 60/40 during the two major drawdowns in this backtest window.
        </p>
        <div style={styles.bearTableWrap}>
          <table style={styles.bearTable}>
            <thead>
              <tr style={styles.bearTableHeader}>
                <th style={styles.bearTh}>Bear Market</th>
                <th style={{ ...styles.bearTh, ...styles.bearWindowCol }}>Window</th>
                <th style={{ ...styles.bearTh, ...styles.bearDurationCol }}>Duration</th>
                <th style={{ ...styles.bearTh, ...styles.bearMetricCol }}>Your Portfolio</th>
                <th style={{ ...styles.bearTh, ...styles.bearMetricCol }}>S&amp;P 500</th>
                <th style={{ ...styles.bearTh, ...styles.bearDeltaCol }}>vs S&amp;P</th>
                <th style={{ ...styles.bearTh, ...styles.bearMetricCol }}>60/40</th>
                <th style={{ ...styles.bearTh, ...styles.bearDeltaCol }}>vs 60/40</th>
              </tr>
            </thead>
            <tbody>
              {bearMarketRows.map((row) => (
                <tr key={row.label} style={styles.bearRow}>
                  <td style={styles.bearTd}>{row.label}</td>
                  <td style={{ ...styles.bearTd, ...styles.bearWindowCol }}>
                    {formatBearDate(row.peakDate)} to {formatBearDate(row.troughDate)}
                  </td>
                  <td style={{ ...styles.bearTd, ...styles.bearDurationCol }}>{row.durationLabel}</td>
                  <td style={{ ...styles.bearTd, ...styles.bearRight }}>
                    {formatPctCell(row.portfolioReturnPct)}
                  </td>
                  <td style={{ ...styles.bearTd, ...styles.bearRight }}>
                    {formatPctCell(row.sp500ReturnPct)}
                  </td>
                  <td style={{ ...styles.bearTd, ...styles.bearRight, ...(row.portfolioReturnPct != null && row.sp500ReturnPct != null ? { color: (row.portfolioReturnPct - row.sp500ReturnPct) >= 0 ? '#2d4a2b' : '#8b1a1a', fontWeight: 700 } : {}) }}>
                    {row.portfolioReturnPct != null && row.sp500ReturnPct != null
                      ? `${(row.portfolioReturnPct - row.sp500ReturnPct) >= 0 ? '+' : ''}${(row.portfolioReturnPct - row.sp500ReturnPct).toFixed(1)}%`
                      : '—'}
                  </td>
                  <td style={{ ...styles.bearTd, ...styles.bearRight }}>
                    {formatPctCell(row.balancedReturnPct)}
                  </td>
                  <td style={{ ...styles.bearTd, ...styles.bearRight, ...(row.portfolioReturnPct != null && row.balancedReturnPct != null ? { color: (row.portfolioReturnPct - row.balancedReturnPct) >= 0 ? '#2d4a2b' : '#8b1a1a', fontWeight: 700 } : {}) }}>
                    {row.portfolioReturnPct != null && row.balancedReturnPct != null
                      ? `${(row.portfolioReturnPct - row.balancedReturnPct) >= 0 ? '+' : ''}${(row.portfolioReturnPct - row.balancedReturnPct).toFixed(1)}%`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={styles.buttonGroup} className="button-group">
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
  portfolioTodayTitle: {
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#0f1f35',
    marginTop: 0,
    marginBottom: '0.5rem'
  },
  portfolioTodayDesc: {
    marginBottom: '1.5rem',
    fontSize: '0.95rem',
    color: '#6d6658',
    lineHeight: 1.5,
    maxWidth: '640px'
  },
  allocationTableWrap: {
    marginBottom: '0.75rem',
    maxWidth: '640px'
  },
  bondNote: {
    marginBottom: '3rem',
    maxWidth: '640px',
    fontSize: '0.9rem',
    color: '#6d6658',
    lineHeight: 1.55
  },
  allocationTable: {
    width: '100%',
    borderCollapse: 'collapse',
    border: '2px solid #d9d2c1',
    background: '#fdfcfa'
  },
  allocationTableHeader: {
    background: '#f0ede5',
    borderBottom: '2px solid #d9d2c1'
  },
  allocationTh: {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '0.8rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: '#0f1f35'
  },
  allocationRow: {
    borderBottom: '1px solid #d9d2c1'
  },
  allocationTotalRow: {
    borderBottom: 'none',
    background: 'rgba(45, 74, 43, 0.08)',
    fontWeight: 700
  },
  allocationTd: {
    padding: '0.85rem 1rem',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '0.95rem',
    color: '#2c2c2c'
  },
  historicalSectionTitle: {
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '1.35rem',
    fontWeight: 700,
    color: '#0f1f35',
    marginTop: 0,
    marginBottom: '0.75rem',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #d9d2c1'
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
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
    border: '1px solid rgba(168, 155, 132, 0.4)',
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
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '1.2rem',
    fontWeight: 700
  },
  chartContainer: {
    background: '#fdfcfa',
    border: '1px solid rgba(168, 155, 132, 0.4)',
    padding: '3rem',
    marginBottom: '2.5rem',
    boxShadow: '0 6px 20px rgba(44, 44, 44, 0.12)',
    position: 'relative',
    overflow: 'hidden'
  },
  chartWrapper: {
    width: '100%',
    height: '420px',
    position: 'relative'
  },
  chartTitle: {
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#1a2f4a',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #a98a4f'
  },
  bearTableWrap: {
    marginBottom: '2rem',
    overflowX: 'auto'
  },
  bearTable: {
    width: '100%',
    borderCollapse: 'collapse',
    border: '2px solid #d9d2c1',
    background: '#fdfcfa'
  },
  bearTableHeader: {
    background: '#f0ede5',
    borderBottom: '2px solid #d9d2c1'
  },
  bearTh: {
    padding: '0.7rem 0.9rem',
    textAlign: 'center',
    verticalAlign: 'bottom',
    fontSize: '0.8rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: '#0f1f35'
  },
  bearRow: {
    borderBottom: '1px solid #d9d2c1'
  },
  bearTd: {
    padding: '0.8rem 0.9rem',
    fontSize: '0.92rem',
    color: '#2c2c2c'
  },
  bearWindowCol: {
    minWidth: '220px'
  },
  bearDurationCol: {
    minWidth: '90px'
  },
  bearMetricCol: {
    minWidth: '110px'
  },
  bearDeltaCol: {
    minWidth: '80px'
  },
  bearRight: {
    textAlign: 'right'
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
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    borderRadius: 0
  }
};

