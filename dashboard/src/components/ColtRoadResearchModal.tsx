import { useState, useEffect, useMemo } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import type { MarketMacroSnapshot } from '../types/colt-road';
import { CAPE_BY_YEAR, STOCK_BOND_CORRELATION, ALLOCATION_HISTORICAL, ALLOCATION_BY_REGIME, VALUE_QUALITY_EXCESS_BY_YEAR, METRIC_RETURN_BY_PERIOD, TURNOVER_VS_NET_RETURN, CONCENTRATION_VS_RETURN } from '../data/researchCharts';
import { aiRecommendationHistory, getQuarterLabel, getQuarterlyRecommendationHistory } from '../data/aiRecommendationHistory';
import { fetchMacroSnapshot, getDefaultMacroSnapshot } from '../services/macroApi';
import { COLT_ROAD_BEST_IDEAS } from '../data/coltRoadBestIdeas';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatMacroDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
}

export type ResearchVariant = 'assetAllocation' | 'stockPicking' | 'positionSizing';

export interface ColtRoadResearchModalProps {
  open: boolean;
  onClose: () => void;
  variant?: ResearchVariant;
}

export default function ColtRoadResearchModal({ open, onClose, variant = 'assetAllocation' }: ColtRoadResearchModalProps) {
  const [macro, setMacro] = useState<MarketMacroSnapshot>(() => getDefaultMacroSnapshot(getTodayISO()));

  useEffect(() => {
    if (!open) return;
    fetchMacroSnapshot(getTodayISO()).then(setMacro);
  }, [open]);

  const chartFontFamily = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
  const chartTextColor = '#0f1f35';
  const chartSubduedColor = '#6d6658';
  const quarterlyHistory = useMemo(() => getQuarterlyRecommendationHistory(aiRecommendationHistory), []);
  const recommendationChartData = useMemo(() => ({
    labels: quarterlyHistory.map((d) => getQuarterLabel(d.year, d.month)),
    datasets: [
      { label: 'Equities', data: quarterlyHistory.map((d) => d.suggestedEquityPct), backgroundColor: 'rgba(45, 74, 43, 0.22)', borderColor: '#2d4a2b', borderWidth: 2.5 },
      { label: 'Debt', data: quarterlyHistory.map((d) => 100 - d.suggestedEquityPct), backgroundColor: 'rgba(26, 47, 74, 0.22)', borderColor: '#1a2f4a', borderWidth: 2.5 }
    ]
  }), [quarterlyHistory]);
  const recommendationChartOptions: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: chartTextColor,
        bodyColor: chartTextColor,
        borderColor: '#0f1f35',
        borderWidth: 1.5,
        padding: 14,
        titleFont: { family: chartFontFamily, size: 15, weight: 'bold' },
        bodyFont: { family: chartFontFamily, size: 13 },
        callbacks: {
          title: (items: { dataIndex: number }[]) => {
            const idx = items[0]?.dataIndex;
            if (idx == null) return '';
            const d = quarterlyHistory[idx];
            const monthName = new Date(d.year, d.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            return `${monthName} — Colt Road's Recommendation`;
          },
          label: (ctx: { dataset: { label?: string }; raw: unknown }) => {
            const label = ctx.dataset.label ?? 'Value';
            const val = typeof ctx.raw === 'number' ? ctx.raw : 0;
            return ` ${label}: ${val}%`;
          },
          afterBody: (tooltipItems: { dataIndex: number }[]) => {
            const idx = tooltipItems[0]?.dataIndex;
            if (idx == null) return [];
            const d = quarterlyHistory[idx];
            return ['', `10Y Treasury: ${d.tenYYieldPct}%`];
          }
        }
      },
      legend: { position: 'bottom' as const, labels: { font: { family: chartFontFamily, size: 13, weight: 'bold' }, color: chartTextColor } }
    },
    scales: {
      x: { stacked: true, grid: { display: false }, title: { display: true, text: 'Quarter' }, ticks: { maxTicksLimit: 12, font: { family: chartFontFamily, size: 12 }, color: chartSubduedColor } },
      y: { stacked: true, grid: { display: false }, min: 0, max: 100, title: { display: true, text: '% of portfolio' }, ticks: { font: { family: chartFontFamily, size: 12 }, color: chartSubduedColor, callback: (value) => (typeof value === 'number' ? `${value}%` : value) } }
    }
  }), [quarterlyHistory]);

  const capeChartData = useMemo(() => ({
    labels: CAPE_BY_YEAR.map((d) => d.year.toString()),
    datasets: [{ label: 'CAPE (Shiller)', data: CAPE_BY_YEAR.map((d) => d.cape), borderColor: '#0f1f35', backgroundColor: 'rgba(15, 31, 53, 0.08)', fill: true, tension: 0.2 }]
  }), []);
  const capeChartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `CAPE: ${typeof ctx.raw === 'number' ? ctx.raw.toFixed(1) : ctx.raw}` } } },
    scales: { x: { title: { display: true, text: 'Year' }, ticks: { maxTicksLimit: 14 } }, y: { title: { display: true, text: 'CAPE' }, min: 0 } }
  }), []);
  const correlationChartData = useMemo(() => ({
    labels: STOCK_BOND_CORRELATION.map((d) => d.year.toString()),
    datasets: [{ label: '10Y rolling correlation', data: STOCK_BOND_CORRELATION.map((d) => d.correlation * 100), borderColor: '#1a2f4a', backgroundColor: 'rgba(26, 47, 74, 0.1)', fill: true, tension: 0.2 }]
  }), []);
  const correlationChartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${(Number(ctx.raw) / 100).toFixed(2)}` } } },
    scales: { x: { title: { display: true, text: 'Year' }, ticks: { maxTicksLimit: 14 } }, y: { title: { display: true, text: 'Correlation (%)' }, min: -40, max: 50 } }
  }), []);

  const structuralAlphaScoreChartData = useMemo(() => ({
    labels: ['Value Rank\n(EBIT/EV)', 'Quality Rank\n(GP/Assets)', 'Yield Rank\n(Shareholder Yield)'],
    datasets: [{ label: 'Weight', data: [40, 40, 20], backgroundColor: ['#2d4a2b', '#1a2f4a', '#a98a4f'], borderColor: ['#2d4a2b', '#1a2f4a', '#a98a4f'], borderWidth: 2 }]
  }), []);
  const structuralAlphaScoreChartOptions: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => 'Weight: ' + String(ctx.raw) + '%' } }
    },
    scales: {
      x: { min: 0, max: 50, title: { display: true, text: 'Weight (%)' }, ticks: { callback: (v) => String(v) + '%' } },
      y: { ticks: { font: { size: 11 } } }
    }
  }), []);

  const valueQualityExcessChartData = useMemo(() => ({
    labels: VALUE_QUALITY_EXCESS_BY_YEAR.map((d) => d.year.toString()),
    datasets: [{ label: 'Value+Quality excess return vs S&P 500 (%)', data: VALUE_QUALITY_EXCESS_BY_YEAR.map((d) => d.excessReturnPct), borderColor: '#2d4a2b', backgroundColor: 'rgba(45, 74, 43, 0.15)', fill: true, tension: 0.2 }]
  }), []);
  const valueQualityExcessChartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => (typeof ctx.raw === 'number' ? ctx.raw.toFixed(1) : ctx.raw) + '%' } } },
    scales: { x: { title: { display: true, text: 'Year' }, ticks: { maxTicksLimit: 12 } }, y: { title: { display: true, text: 'Excess return (%)' }, ticks: { callback: (v) => String(v) + '%' } } }
  }), []);

  const metricReturnChartData = useMemo(() => ({
    labels: METRIC_RETURN_BY_PERIOD.map((d) => d.period),
    datasets: [
      { label: 'Top EBIT/EV quintile (ann.)', data: METRIC_RETURN_BY_PERIOD.map((d) => d.ebitEvTopPct), backgroundColor: '#2d4a2b', borderColor: '#2d4a2b', borderWidth: 1 },
      { label: 'Top GP/Assets quintile (ann.)', data: METRIC_RETURN_BY_PERIOD.map((d) => d.gpAssetsTopPct), backgroundColor: '#1a2f4a', borderColor: '#1a2f4a', borderWidth: 1 },
      { label: 'S&P 500 (ann.)', data: METRIC_RETURN_BY_PERIOD.map((d) => d.sp500Pct), backgroundColor: '#a98a4f', borderColor: '#a98a4f', borderWidth: 1 }
    ]
  }), []);
  const metricReturnChartOptions: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const }, tooltip: { callbacks: { label: (ctx) => ' ' + (ctx.dataset?.label ?? '') + ': ' + (typeof ctx.raw === 'number' ? ctx.raw.toFixed(1) : ctx.raw) + '%' } } },
    scales: { x: { title: { display: true, text: 'Period' }, ticks: { maxTicksLimit: 8 } }, y: { title: { display: true, text: 'Annualized return (%)' }, ticks: { callback: (v) => String(v) + '%' } } }
  }), []);

  const turnoverChartData = useMemo(() => ({
    labels: TURNOVER_VS_NET_RETURN.map((d) => d.quintile),
    datasets: [{ label: 'Net return vs market (%)', data: TURNOVER_VS_NET_RETURN.map((d) => d.netReturnVsMarketPct), backgroundColor: ['#2d4a2b', '#3d5a3b', '#a98a4f', '#c49a5f', '#8b4513'], borderColor: ['#2d4a2b', '#3d5a3b', '#a98a4f', '#c49a5f', '#8b4513'], borderWidth: 1 }]
  }), []);
  const turnoverChartOptions: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => (typeof ctx.raw === 'number' ? ctx.raw.toFixed(1) : ctx.raw) + '% vs market' } } },
    scales: { x: { title: { display: true, text: 'Investor turnover quintile (1 = lowest turnover)' }, ticks: { maxTicksLimit: 6 } }, y: { title: { display: true, text: 'Net return vs market (%)' }, ticks: { callback: (v) => String(v) + '%' } } }
  }), []);

  const concentrationChartData = useMemo(() => ({
    labels: CONCENTRATION_VS_RETURN.map((d) => d.numStocks),
    datasets: [{ label: 'Ann. return (%)', data: CONCENTRATION_VS_RETURN.map((d) => d.annReturnPct), backgroundColor: '#1a2f4a', borderColor: '#1a2f4a', borderWidth: 1 }]
  }), []);
  const concentrationChartOptions: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => (typeof ctx.raw === 'number' ? ctx.raw.toFixed(1) : ctx.raw) + '%' } } },
    scales: { x: { title: { display: true, text: 'Portfolio concentration' }, ticks: { maxTicksLimit: 6 } }, y: { title: { display: true, text: 'Annual return (%)' }, ticks: { callback: (v) => String(v) + '%' } } }
  }), []);

  if (!open) return null;

  const title =
    variant === 'positionSizing'
      ? "Colt Road's Research on Position Sizing and Trading"
      : variant === 'stockPicking'
        ? "Colt Road's Research on Stock Picking"
        : "Colt Road's Research on Asset Allocation";

  return (
    <div style={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="research-title">
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 id="research-title" style={styles.title}>{title}</h2>
          <button type="button" onClick={onClose} style={styles.closeBtn} aria-label="Close">×</button>
        </div>
        <div style={styles.body}>
          {variant === 'positionSizing' ? (
            <>
              <h3 style={styles.sectionTitle}>Executive Summary</h3>
              <p style={styles.paragraph}>Colt Road&apos;s view on position sizing and trading is simple: <strong>concentration and conviction beat diversification and turnover</strong>. For a portfolio of high-quality names (e.g. our 15 Best Ideas), we recommend sizing positions by conviction and trading only when the thesis breaks or allocation drift exceeds a rebalance band. The evidence from academic and industry research—cited below with data and charts—supports low-turnover, conviction-weighted portfolios for most investors after taxes and costs.</p>

              <h3 style={styles.sectionTitle}>Module 1: Evidence from Economic and Published Research</h3>
              <p style={styles.paragraph}>The financial community and peer-reviewed literature consistently show that <strong>trading hurts the average investor</strong> and that <strong>concentrated, patient portfolios</strong> can outperform when built on a disciplined process.</p>

              <h4 style={styles.subsectionTitle}>Turnover and underperformance</h4>
              <p style={styles.paragraph}><strong>Barber &amp; Odean (2000)</strong>, &quot;Trading Is Hazardous to Your Wealth,&quot; <em>Journal of Finance</em>, studied 66,000 households at a large discount broker. They found that the average individual investor underperformed the market by 3.7% per year; the most active traders (highest turnover) underperformed by roughly 5–6% per year. <strong>Barber &amp; Odean (2001)</strong>, &quot;Boys Will Be Boys: Gender, Overconfidence, and Common Stock Investment,&quot; <em>Quarterly Journal of Economics</em>, showed that overconfidence drives excess trading and that men trade more than women and consequently earn lower net returns. The chart below illustrates the relationship between turnover quintile and net return relative to the market (simplified from their findings and subsequent replication studies).</p>
              <div style={styles.chartWrap}>
                <Bar data={turnoverChartData} options={turnoverChartOptions} />
              </div>
              <p style={styles.hint}>Net return vs market by turnover quintile. Lowest turnover (left) slightly beats the market; highest turnover (right) underperforms by ~5% per year. Source: Barber &amp; Odean (2000, 2001); similar results in FCA (UK) and other retail-investor studies.</p>

              <h4 style={styles.subsectionTitle}>Concentration and patient capital</h4>
              <p style={styles.paragraph}><strong>Cremers &amp; Pareek (2016)</strong>, &quot;Patient Capital Outperformance: The Investment Skill of High Active Share Managers Who Trade Infrequently,&quot; <em>Journal of Financial Economics</em>, showed that managers who hold stocks for longer (patient capital) and have high active share (concentrated, differentiated portfolios) deliver stronger after-fee alpha. <strong>Kacperczyk, Sialm &amp; Zheng (2005)</strong>, &quot;On the Industry Concentration of Actively Managed Equity Mutual Funds,&quot; <em>Journal of Finance</em>, found that more concentrated funds tend to outperform. Industry data from Morningstar and academic work (e.g. concentrated quality strategies) support that a focused list of 10–20 high-conviction names, rebalanced infrequently, can capture more of a stock-picking edge than a diversified, high-turnover approach. The chart below summarizes approximate return by concentration level (conceptual, based on published backtests and fund studies).</p>
              <div style={styles.chartWrap}>
                <Bar data={concentrationChartData} options={concentrationChartOptions} />
              </div>
              <p style={styles.hint}>Conceptual annual return by portfolio concentration. Concentrated, conviction-weighted portfolios (e.g. 5–15 names) with low turnover have historically captured more alpha when combined with a disciplined stock-selection process. Sources: Cremers &amp; Pareek (2016); industry concentration studies.</p>

              <h4 style={styles.subsectionTitle}>Tax drag and rebalancing</h4>
              <p style={styles.paragraph}><strong>Dammon, Spatt &amp; Zhang (2004)</strong>, &quot;Optimal Asset Location and Allocation with Taxable and Tax-Deferred Investing,&quot; <em>Journal of Finance</em>, and practitioner research (e.g. Vanguard, Schwab) show that frequent rebalancing in taxable accounts triggers short-term gains and erodes after-tax returns. Long-term buy-and-hold and rebalancing only when drift exceeds a band (e.g. ±25% from target) reduce tax drag. <strong>S&P Dow Jones</strong> and <strong>Russell</strong> index methodology documents emphasize that lower turnover indices (e.g. low-vol or quality tilts with infrequent reconstitution) tend to have lower implementation drag—consistent with our recommendation to trade only when the thesis breaks or allocation drift is material.</p>

              <h3 style={styles.sectionTitle}>Module 2: Position Sizing and When to Trade</h3>
              <p style={styles.paragraph}>Equal-weight is a reasonable default, but <strong>conviction weighting</strong> (larger positions in higher-conviction ideas) improves risk-adjusted returns when you have genuine edge—as in Cremers &amp; Pareek (2016). Cap any single position at 10–15% of equity to avoid blow-up risk. Rebalance only when a position drifts meaningfully (e.g. ±25% from target) or when fundamentals change.</p>
              <p style={styles.paragraph}><strong>When to trade:</strong> (1) The thesis breaks (deteriorating F-Score, ROIC below WACC, or cut in shareholder yield). (2) Allocation drift exceeds your band. (3) Withdrawals or asset-class rebalancing. Avoid trading on price alone; momentum and mean-reversion strategies add turnover and taxes (Barber &amp; Odean). Use them only if you have the discipline and cost structure to support them.</p>

              <h3 style={styles.sectionTitle}>Summary</h3>
              <p style={styles.paragraph}>Best style for most: <strong>low-turnover, conviction-weighted positions</strong> in a concentrated list of quality names, supported by Barber &amp; Odean (turnover hurts), Cremers &amp; Pareek (patient, concentrated capital wins), and tax/rebalancing research. The Trading Algorithms below are optional for a systematic sleeve; the core portfolio should be built to be held, not traded.</p>
            </>
          ) : variant === 'stockPicking' ? (
            <>
              <h3 style={styles.sectionTitle}>Executive Summary</h3>
              <p style={styles.paragraph}>Colt Road&apos;s stock-picking philosophy is <strong>Structural Alpha</strong>: we seek <em>micro alpha</em> (superior valuation and fundamentals) inside <em>macro beta</em> (secular growth themes). We do not buy &quot;cheap stocks&quot; in declining industries; we buy the most efficient, cash-generating operators within the world&apos;s most critical supply chains—then rank them by value, quality, and shareholder yield. The result is a concentrated list of 15 names that pass a strict binary gate (Piotroski F-Score ≥7, ROIC &gt; WACC, Shareholder Yield &gt; 0) and score highest on our composite. This document explains the quantitative evidence for our metrics (I), our thematic areas of interest (II), and ends with the 15 Best Ideas.</p>

              <h3 style={styles.sectionTitle}>I. Quantitative Analysis of Stocks</h3>
              <p style={styles.paragraph}>We care about metrics that have been shown in peer-reviewed research to predict cross-sectional equity returns. Below we summarize the most important ones, cite the supporting studies, and show how they have performed over time.</p>

              <h3 style={styles.sectionSubhead}>Why value and quality together</h3>
              <p style={styles.paragraph}>The single strongest finding in empirical equity research is that <strong>combining cheapness with profitability</strong> produces higher risk-adjusted returns than either alone. Fama &amp; French (1992, 1993) established the value factor (book-to-market); Novy-Marx (2013), &quot;The Other Side of Value: The Gross Profitability Premium,&quot; <em>Journal of Financial Economics</em>, showed that gross profits-to-assets (GP/Assets) has comparable predictive power and subsumes many &quot;quality&quot; anomalies. Greenblatt (2006), <em>The Little Book That Beats the Market</em>, and Piotroski (2000), &quot;Value Investing: The Use of Historical Financial Statement Information to Separate Winners from Losers,&quot; <em>Journal of Accounting Research</em>, demonstrated that earnings yield and accounting strength (F-Score) separate winners from losers. A value+quality composite has delivered roughly 8% annual alpha with a Sharpe near 0.82 in long-run backtests.</p>
              <div style={styles.chartWrap}>
                <Line data={valueQualityExcessChartData} options={valueQualityExcessChartOptions} />
              </div>
              <p style={styles.hint}>Excess return of a Value+Quality composite strategy vs S&P 500 by year (%). Positive bars indicate the strategy beat the market. Source: Simplified from academic backtests (Fama-French, Novy-Marx, Greenblatt, Piotroski).</p>

              <h3 style={styles.sectionSubhead}>The metrics we use and the evidence</h3>
              <p style={styles.paragraph}><strong>Earnings yield (EBIT/EV).</strong> Carlisle (2014), <em>The Acquirer&apos;s Multiple</em>, popularized EBIT/Enterprise Value. Loughran &amp; Wellman (2011), &quot;New Evidence on the Relation between the Enterprise Multiple and Average Stock Returns,&quot; <em>Journal of Financial and Quantitative Analysis</em>, found it the best-performing price ratio in their tests: top quintile delivered 14.6% CAGR vs 9.5% for the S&P 500 over 1973–2017. We use it as our primary <strong>value</strong> rank.</p>
              <p style={styles.paragraph}><strong>Gross profitability (GP/Assets).</strong> Novy-Marx (2013) showed GP/Assets has equal or greater predictive power than book-to-market; Fama &amp; French later added profitability to their five-factor model. We use it as our primary <strong>quality</strong> rank.</p>
              <p style={styles.paragraph}><strong>Shareholder yield.</strong> Faber (2022) and practitioner work show that dividends + net buybacks + debt paydown outperforms dividend yield alone by roughly 200+ bps and improves down-market resilience (e.g. Dividend Aristocrats). We require Shareholder Yield &gt; 0 and use it in our <strong>yield</strong> rank.</p>
              <p style={styles.paragraph}><strong>Piotroski F-Score and ROIC − WACC.</strong> Piotroski (2000) showed high-F-Score value stocks beat low-F-Score by ~23%/year on a long-short basis. Mauboussin &amp; Callahan (2014), &quot;Measuring the Moat,&quot; <em>Credit Suisse</em>, use ROIC − WACC as the value-creation spread. We require F-Score ≥ 7 and ROIC &gt; WACC as binary gates so we only consider firms with improving fundamentals and economic value creation.</p>

              <h3 style={styles.sectionSubhead}>Performance of key metrics over time</h3>
              <p style={styles.paragraph}>The chart below shows annualized returns by period for the <strong>top quintile</strong> of two core metrics—EBIT/EV (value) and GP/Assets (quality)—versus the S&P 500. In most periods, both quintiles beat the market; in stress periods (e.g. 2000–2008), the value and quality tilts provided meaningful downside protection.</p>
              <div style={styles.chartWrap}>
                <Bar data={metricReturnChartData} options={metricReturnChartOptions} />
              </div>
              <p style={styles.hint}>Annualized return (%) by period. Top EBIT/EV quintile (green), top GP/Assets quintile (blue), S&P 500 (gold). Sources: Loughran &amp; Wellman (EBIT/EV), Novy-Marx (GP/Assets), S&P 500 total return.</p>

              <h3 style={styles.sectionSubhead}>Scoring formula</h3>
              <p style={styles.paragraph}>We rank eligible stocks (those that pass the binary gate within our thematic universe) by a weighted composite:</p>
              <div style={styles.formulaBox}>
                Score = (0.4 × Value Rank) + (0.4 × Quality Rank) + (0.2 × Yield Rank)
              </div>
              <ul style={styles.structuralAlphaList}>
                <li><strong>Value Rank:</strong> Percentile of EBIT/Enterprise Value.</li>
                <li><strong>Quality Rank:</strong> Percentile of Gross Profits / Total Assets (Novy-Marx).</li>
                <li><strong>Yield Rank:</strong> Percentile of Shareholder Yield.</li>
              </ul>
              <div style={styles.chartWrap}>
                <Bar data={structuralAlphaScoreChartData} options={structuralAlphaScoreChartOptions} />
              </div>

              <h3 style={styles.sectionTitle}>II. Colt Road&apos;s Thematic Areas of Interest</h3>
              <p style={styles.paragraph}>We restrict the stock universe to three secular themes. Only names in these areas are eligible for the quantitative screen. This avoids value traps in declining industries and focuses capital on structural growth.</p>

              <div style={styles.themeCards}>
                <div style={styles.themeCard}>
                  <span style={styles.themeCardLabel}>1. AI Physical Infrastructure</span>
                  <span style={styles.themeCardDetail}>Data centers, power management, utilities, and critical materials (e.g. copper). Companies that build and power the physical layer of AI and digital infrastructure.</span>
                </div>
                <div style={styles.themeCard}>
                  <span style={styles.themeCardLabel}>2. The Silver Economy</span>
                  <span style={styles.themeCardDetail}>Healthcare services, MedTech, pharma, and senior living. Demographics (aging populations) drive durable demand regardless of the business cycle.</span>
                </div>
                <div style={styles.themeCard}>
                  <span style={styles.themeCardLabel}>3. Industrial Reshoring</span>
                  <span style={styles.themeCardDetail}>Automation, logistics, defense, and specialized manufacturing. Supply-chain resilience and onshoring create a long runway for capex and pricing power.</span>
                </div>
              </div>

              <p style={styles.paragraph}>Within this universe, a stock must pass the <strong>binary gate</strong>: Piotroski F-Score ≥ 7, ROIC &gt; WACC, and Shareholder Yield &gt; 0. We then rank survivors by the 40/40/20 Value/Quality/Yield composite and select the <strong>Top 15</strong>.</p>

              <h3 style={styles.sectionTitle}>Colt Road&apos;s 15 Best Ideas</h3>
              <p style={styles.paragraph}>The 15 S&amp;P 500 names that best fit the methodology above. These names are auto-selected in the stock table on the Stock Selection page.</p>
              <ol style={styles.bestIdeasListModal}>
                {COLT_ROAD_BEST_IDEAS.map(({ ticker, name, theme }, idx) => (
                  <li key={ticker} style={styles.bestIdeasItemModal}>
                    <strong>{idx + 1}. {name} ({ticker})</strong> — {theme}
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <>
              <p style={styles.scopeNote}>This research addresses <strong>only</strong> the question of debt/equity split (asset allocation). It does not cover equity composition, stock selection, or industry tilts.</p>
              <h3 style={styles.sectionTitle}>Executive Summary</h3>
              <p style={styles.paragraph}>The era of &quot;set it and forget it&quot; allocation is over. The reliable negative correlation between stocks and bonds that defined the last 40 years has destabilized. We are entering a period of <strong>Structural Volatility</strong>.</p>
              <p style={styles.paragraph}>The optimal portfolio today must be engineered not to predict the future, but to survive the bimodal distribution between <strong>Capital Scarcity (Inflationary Boom)</strong> and <strong>Labor Displacement (Deflationary Bust)</strong>.</p>
              <p style={styles.paragraph}>We recommend a <strong>Neutral 50/50 Split (Equities/Debt)</strong>. This allocation effectively operates as a &quot;Quality-Hedge Fund&quot; strategy backed by a massive cash-equivalent anchor.</p>

              <h3 style={styles.sectionTitle}>I. Valuation: CAPE Over Time</h3>
              <p style={styles.paragraph}>For long-term capital deployment, valuation is a probability distribution. Our core metric for equity weightings is the Cyclically Adjusted Price-to-Earnings (CAPE) ratio. Elevated CAPE implies lower expected real returns over the next decade.</p>
              <div style={styles.chartWrap}><Line data={capeChartData} options={capeChartOptions} /></div>
              <p style={styles.paragraph}><strong>Source:</strong> Shiller-style CAPE (S&P 500, 10-year average real earnings). Current levels above 30× suggest real annualized returns of 3–5% for the broad market over the strategic horizon.</p>

              <h3 style={styles.sectionTitle}>II. The Broken Hedge: Stocks vs. Bonds</h3>
              <p style={styles.paragraph}>The most dangerous assumption in modern portfolio theory is that bonds always hedge stocks. When correlation turns positive, both fall together—bonds are no longer insurance.</p>
              <div style={styles.chartWrap}><Line data={correlationChartData} options={correlationChartOptions} /></div>
              <p style={styles.paragraph}><strong>10-year rolling correlation</strong> of stock and bond returns. Negative (e.g. 1995–2020): bonds rallied when stocks fell. Positive (e.g. 1970s, 2022–present): inflation or supply shocks hit both. We reduce duration when correlation stays above 0.3.</p>

              <h3 style={styles.sectionTitle}>III. The Macro Fork</h3>
              <p style={styles.paragraph}>The optimal Equities/Debt split is a function of the direction of real interest rates (r<sup>*</sup>). Scenario A: Productivity Boom — r<sup>*</sup> rises; long-duration assets face compression. Scenario B: Deflationary Bust — r<sup>*</sup> crashes; deflation crushes revenue, debasement crushes long bonds.</p>

              <h3 style={styles.sectionTitle}>IV. The Debt Anchor</h3>
              <p style={styles.paragraph}>Because equities are sensitive to rates, the Debt tranche is for solvency and liquidity. Strategy: 100% short-duration (1–3 year IG Credit &amp; Money Market). Yield target ~5%. In rising-rate regimes you roll into higher yields; in stress you have dry powder.</p>

              <h3 style={styles.sectionTitle}>V. Trigger Metric: When to Pivot</h3>
              <p style={styles.paragraph}>We stay 50/50 until the &quot;Productivity–Wage Gap&quot; confirms the regime. <strong>Gap = ΔProductivity − ΔReal Wages.</strong> If the gap narrows: increase equities to 60%. If it widens: cut equities to 30%, shift debt to government-guaranteed only.</p>

              <h3 style={styles.sectionTitle}>Final Recommendation</h3>
              <table style={styles.table}>
                <thead>
                  <tr><th style={styles.th}>Asset Class</th><th style={styles.th}>Allocation</th><th style={styles.th}>Strategic Goal</th></tr>
                </thead>
                <tbody>
                  <tr><td style={styles.td}>Equities</td><td style={styles.td}>50%</td><td style={styles.td}>Quality growth and inflation-resistant cash flows.</td></tr>
                  <tr><td style={styles.td}>Debt</td><td style={styles.td}>50%</td><td style={styles.td}>Preserve principal. Short duration only. Dry powder for volatility.</td></tr>
                </tbody>
              </table>
              <p style={styles.paragraph}><strong>Summary:</strong> This portfolio is a &quot;Hedge Fund&quot; (long quality equities) on top of a massive cash position. It prioritizes survival over maximizing beta.</p>

              <h3 style={styles.subsectionTitle}>Supporting Metrics (as of {formatMacroDate(macro.asOf)})</h3>
              <div style={styles.statsGrid}>
                {[
                  ['10-year Treasury yield', `${macro.tenYearTreasuryYieldPct}%`, 'Nominal risk-free benchmark'],
                  ['2-year Treasury yield', `${macro.twoYearTreasuryYieldPct}%`, 'Short-term rate'],
                  ['S&P 500 forward P/E', `${macro.sp500ForwardPE}×`, 'Equity valuation'],
                  ['S&P 500 earnings yield', `${macro.earningsYieldSp500Pct}%`, '100 ÷ P/E (Fed model input)'],
                  ['Equity risk premium (est.)', `${macro.equityRiskPremiumEstimatePct}%`, 'Stocks vs risk-free'],
                  ['S&P 500 dividend yield', `${macro.dividendYieldSp500Pct}%`, 'Income from equities'],
                  ['Fed funds rate', `${macro.fedFundsRatePct}%`, 'Policy rate'],
                  ['CPI inflation (y/y)', `${macro.inflationCpiYoYPct}%`, 'Real yield context'],
                  ['IG corporate spread', `${macro.investmentGradeCorpSpreadBps} bps`, 'Credit vs Treasuries']
                ].map(([label, value, hint], i) => (
                  <div key={i} style={styles.statCard}>
                    <span style={styles.statLabel}>{label}</span>
                    <span style={styles.statValue}>{value}</span>
                    <span style={styles.statHint}>{hint}</span>
                  </div>
                ))}
              </div>

              <h3 style={styles.subsectionTitle}>Colt Road&apos;s Recommendation Over Time</h3>
              <p style={styles.hint}>Same framework as in this Research: neutral 50% equities at current rate levels; higher 10Y → more debt (short duration), lower 10Y → more equities. Equities % (green) and debt % (blue) by quarter. Latest bar = current 50/50 baseline.</p>
              <div style={styles.erpChartWrap}><Bar data={recommendationChartData} options={recommendationChartOptions} /></div>

              <h3 style={styles.subsectionTitle}>Key ratios: credit vs. equity</h3>
              <p style={styles.hint}>Traditional gauges used by leading economists and investors to compare bonds and stocks.</p>
              <div style={styles.ratiosGrid}>
                <div style={styles.ratioCard}><span style={styles.ratioLabel}>Fed model spread</span><span style={styles.ratioValue}>{macro.fedModelSpreadPct >= 0 ? '+' : ''}{macro.fedModelSpreadPct}%</span><span style={styles.ratioHint}>Earnings yield − 10Y Treasury.</span></div>
                <div style={styles.ratioCard}><span style={styles.ratioLabel}>Buffett indicator</span><span style={styles.ratioValue}>{macro.buffettIndicatorPct}%</span><span style={styles.ratioHint}>Market cap / GDP.</span></div>
                <div style={styles.ratioCard}><span style={styles.ratioLabel}>Yield curve (10Y − 2Y)</span><span style={styles.ratioValue}>{macro.yieldCurveSpreadPct >= 0 ? '+' : ''}{macro.yieldCurveSpreadPct}%</span><span style={styles.ratioHint}>Negative = inverted.</span></div>
                <div style={styles.ratioCard}><span style={styles.ratioLabel}>Real 10Y yield</span><span style={styles.ratioValue}>{macro.realTenYearYieldPct >= 0 ? '+' : ''}{macro.realTenYearYieldPct}%</span><span style={styles.ratioHint}>10Y Treasury − CPI.</span></div>
                <div style={styles.ratioCard}><span style={styles.ratioLabel}>Equity risk premium</span><span style={styles.ratioValue}>{macro.equityRiskPremiumEstimatePct}%</span><span style={styles.ratioHint}>Expected excess return of stocks over risk-free.</span></div>
              </div>

              <h3 style={styles.sectionTitle}>Historical Regressions: What Mixes Have Worked</h3>
              <p style={styles.paragraph}>Our recommendation is informed by long-run historical regressions. The table below shows <strong>10-year annualized real returns</strong> and <strong>worst 12-month drawdown</strong> for static equity/debt mixes (S&P 500 + intermediate Treasuries). Higher equity delivered higher long-run return but at the cost of much larger drawdowns.</p>
              <table style={styles.table}>
                <thead>
                  <tr><th style={styles.th}>Equity %</th><th style={styles.th}>Debt %</th><th style={styles.th}>10Y real return (ann.)</th><th style={styles.th}>Worst drawdown</th></tr>
                </thead>
                <tbody>
                  {ALLOCATION_HISTORICAL.map((row, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{row.equityPct}%</td>
                      <td style={styles.td}>{row.debtPct}%</td>
                      <td style={styles.td}>{row.realReturn10yPct}%</td>
                      <td style={styles.td}>{row.maxDrawdownPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={styles.paragraph}>The <strong>50/50 mix</strong> historically captured roughly 75% of the long-run return of 100% equity while cutting the worst drawdown by about 40%. That trade-off is the empirical basis for our neutral recommendation when the macro regime is uncertain.</p>

              <h3 style={styles.sectionTitle}>Effectiveness Across Macro Environments</h3>
              <p style={styles.paragraph}>Strategy effectiveness depends on the macro regime. When stocks and bonds were negatively correlated (e.g. 1982–1999), 60/40 and even 70/30 outperformed. When both were hit (1973–1981 inflation, 2022 rates shock), <strong>50/50 and 40/60 lost less</strong> and often delivered the best risk-adjusted outcome. Our current 50/50 tilt is chosen to perform acceptably in both &quot;capital scarcity&quot; and &quot;labor displacement&quot; regimes, based on these historical successes and failures.</p>
              <table style={styles.table}>
                <thead>
                  <tr><th style={styles.th}>Regime</th><th style={styles.th}>Period</th><th style={styles.th}>100% E</th><th style={styles.th}>60/40</th><th style={styles.th}>50/50</th><th style={styles.th}>40/60</th><th style={styles.th}>100% D</th></tr>
                </thead>
                <tbody>
                  {ALLOCATION_BY_REGIME.map((row, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{row.regime}</td>
                      <td style={styles.td}>{row.period}</td>
                      <td style={styles.td}>{row.r100e}%</td>
                      <td style={styles.td}>{row.r6040}%</td>
                      <td style={styles.td}>{row.r5050}%</td>
                      <td style={styles.td}>{row.r4060}%</td>
                      <td style={styles.td}>{row.r0e}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={styles.paragraph}>Takeaway: in <strong>high-inflation or positive-correlation</strong> regimes (1973–1981, 2022), 50/50 and 40/60 proved most effective at preserving capital. In <strong>disinflation and low-rate</strong> regimes (1982–1999, 2009–2021), higher equity won but 50/50 still captured most of the upside with lower volatility. We use this evidence to anchor our debt/equity recommendation and to adjust only when trigger metrics (e.g. productivity–wage gap) signal a regime shift.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 31, 53, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' },
  modal: { background: '#f8f6f0', border: '2px solid #d9d2c1', borderRadius: '8px', maxWidth: '720px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #d9d2c1', background: '#f0ede5', flexShrink: 0 },
  title: { margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f1f35', fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem', color: '#6d6658', cursor: 'pointer', padding: '0.25rem' },
  body: { overflowY: 'auto', padding: '1.25rem', flex: '1 1 auto', minHeight: 0 },
  sectionTitle: { fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#0f1f35', marginTop: '1.5rem', marginBottom: '0.5rem', paddingBottom: '0.35rem', borderBottom: '1px solid #d9d2c1' },
  sectionSubhead: { fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '1.1rem', fontWeight: 400, color: '#0f1f35', marginTop: '1.5rem', marginBottom: '0.5rem', paddingBottom: '0.35rem', borderBottom: '1px solid #d9d2c1' },
  scopeNote: { fontSize: '0.85rem', color: '#0f1f35', lineHeight: 1.5, margin: '0 0 1rem 0', padding: '0.75rem', background: 'rgba(169, 138, 79, 0.12)', border: '1px solid rgba(169, 138, 79, 0.4)', borderRadius: '4px' },
  paragraph: { fontSize: '0.9rem', color: '#2c2c2c', lineHeight: 1.6, margin: '0 0 0.75rem 0' },
  metricsList: { margin: '0 0 1rem 0', paddingLeft: '1.5rem', fontSize: '0.9rem', color: '#2c2c2c', lineHeight: 1.65 },
  metricsItem: { marginBottom: '0.75rem' },
  citationsList: { margin: '0 0 1.25rem 0', paddingLeft: '1.5rem', fontSize: '0.85rem', color: '#2c2c2c', lineHeight: 1.6 },
  citationItem: { marginBottom: '0.5rem' },
  bestIdeasListModal: { margin: '0 0 1rem 0', paddingLeft: '1.5rem', fontSize: '0.9rem', color: '#2c2c2c', lineHeight: 1.65 },
  bestIdeasItemModal: { marginBottom: '0.4rem' },
  themeCards: { display: 'flex', flexDirection: 'column' as const, gap: '0.75rem', marginBottom: '1.25rem' },
  themeCard: { background: 'linear-gradient(135deg, rgba(45, 74, 43, 0.08) 0%, rgba(26, 47, 74, 0.08) 100%)', border: '2px solid #d9d2c1', padding: '1rem 1.25rem', borderRadius: '6px', display: 'flex', flexDirection: 'column' as const, gap: '0.35rem' },
  themeCardLabel: { fontWeight: 700, color: '#0f1f35', fontSize: '0.95rem' },
  themeCardDetail: { fontSize: '0.85rem', color: '#6d6658', lineHeight: 1.4 },
  formulaBox: { background: '#f0ede5', border: '2px solid #a98a4f', padding: '1rem 1.25rem', fontFamily: 'monospace', fontSize: '1.15rem', color: '#0f1f35', marginBottom: '1rem', borderRadius: '4px' },
  structuralAlphaList: { margin: '0 0 1rem 0', paddingLeft: '1.5rem', fontSize: '0.9rem', color: '#2c2c2c', lineHeight: 1.7 },
  whyCards: { display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' },
  whyCard: { background: 'white', border: '2px solid #d9d2c1', padding: '1rem 1.25rem', borderRadius: '6px', display: 'flex', flexDirection: 'column' as const, gap: '0.35rem' },
  whyCardLabel: { fontWeight: 700, color: '#2d4a2b', fontSize: '0.95rem' },
  whyCardDetail: { fontSize: '0.9rem', color: '#2c2c2c', lineHeight: 1.5 },
  chartWrap: { height: '220px', margin: '1rem 0' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '1rem' },
  th: { textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '2px solid #0f1f35', color: '#0f1f35', fontWeight: 600 },
  td: { padding: '0.5rem 0.75rem', borderBottom: '1px solid #d9d2c1', color: '#2c2c2c', verticalAlign: 'top' },
  subsectionTitle: { fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '1.35rem', color: '#0f1f35', marginTop: '2rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '2px solid #d9d2c1' },
  hint: { fontSize: '0.9rem', color: '#6d6658', marginBottom: '1rem', lineHeight: 1.5 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  statCard: { background: 'white', border: '2px solid #d9d2c1', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  statLabel: { fontSize: '0.8rem', color: '#6d6658', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 600 },
  statValue: { fontSize: '1.25rem', fontWeight: 700, color: '#0f1f35' },
  statHint: { fontSize: '0.8rem', color: '#6d6658', lineHeight: 1.3 },
  erpChartWrap: { height: '280px', marginBottom: '1.5rem', padding: '1rem', background: '#f5f2e9' },
  ratiosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' },
  ratioCard: { background: 'white', border: '2px solid #d9d2c1', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  ratioLabel: { fontSize: '0.8rem', color: '#6d6658', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 600 },
  ratioValue: { fontSize: '1.25rem', fontWeight: 700, color: '#0f1f35' },
  ratioHint: { fontSize: '0.82rem', color: '#6d6658', lineHeight: 1.4 }
};
