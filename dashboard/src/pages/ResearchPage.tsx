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

import { fetchMacroSnapshot, getDefaultMacroSnapshot } from '../services/macroApi';
import { COLT_ROAD_BEST_IDEAS } from '../data/coltRoadBestIdeas';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const COLT_ICON = '/colt-icon.png?v=2';

type Tab = 'assetAllocation' | 'stockPicking' | 'tradingStrategies';

const TABS: { id: Tab; label: string }[] = [
  { id: 'assetAllocation', label: '(1) Asset Allocation' },
  { id: 'stockPicking', label: '(2) Stock Selection' },
  { id: 'tradingStrategies', label: '(3) Trading Strategies' }
];

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

interface ResearchPageProps {
  onBack: () => void;
  onStartPortfolio: () => void;
}

export default function ResearchPage({ onBack, onStartPortfolio }: ResearchPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('assetAllocation');
  const [macro, setMacro] = useState<MarketMacroSnapshot>(() => getDefaultMacroSnapshot(getTodayISO()));

  useEffect(() => {
    fetchMacroSnapshot(getTodayISO()).then(setMacro);
  }, []);

  const capeChartData = useMemo(() => ({
    labels: CAPE_BY_YEAR.map((d) => d.year.toString()),
    datasets: [{ label: 'CAPE (Shiller)', data: CAPE_BY_YEAR.map((d) => d.cape), borderColor: '#0f1f35', backgroundColor: 'rgba(15, 31, 53, 0.08)', fill: true, tension: 0.2 }]
  }), []);
  const capeChartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `CAPE: ${typeof ctx.raw === 'number' ? ctx.raw.toFixed(1) : ctx.raw}` } } },
    scales: { x: { title: { display: true, text: 'Year' }, ticks: { maxTicksLimit: 14 } }, y: { title: { display: true, text: 'CAPE' }, min: 0 } }
  }), []);

  const correlationChartData = useMemo(() => ({
    labels: STOCK_BOND_CORRELATION.map((d) => d.year.toString()),
    datasets: [{ label: '10Y rolling correlation', data: STOCK_BOND_CORRELATION.map((d) => d.correlation * 100), borderColor: '#1a2f4a', backgroundColor: 'rgba(26, 47, 74, 0.1)', fill: true, tension: 0.2 }]
  }), []);
  const correlationChartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${(Number(ctx.raw) / 100).toFixed(2)}` } } },
    scales: { x: { title: { display: true, text: 'Year' }, ticks: { maxTicksLimit: 14 } }, y: { title: { display: true, text: 'Correlation (%)' }, min: -40, max: 50 } }
  }), []);

  const structuralAlphaScoreChartData = useMemo(() => ({
    labels: ['Value Rank\n(EBIT/EV)', 'Quality Rank\n(GP/Assets)', 'Yield Rank\n(Shareholder Yield)'],
    datasets: [{ label: 'Weight', data: [40, 40, 20], backgroundColor: ['#2d4a2b', '#1a2f4a', '#a98a4f'], borderColor: ['#2d4a2b', '#1a2f4a', '#a98a4f'], borderWidth: 2 }]
  }), []);
  const structuralAlphaScoreChartOptions: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true, maintainAspectRatio: false, indexAxis: 'y' as const,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => 'Weight: ' + String(ctx.raw) + '%' } } },
    scales: { x: { min: 0, max: 50, title: { display: true, text: 'Weight (%)' }, ticks: { callback: (v) => String(v) + '%' } }, y: { ticks: { font: { size: 11 } } } }
  }), []);

  const valueQualityExcessChartData = useMemo(() => ({
    labels: VALUE_QUALITY_EXCESS_BY_YEAR.map((d) => d.year.toString()),
    datasets: [{ label: 'Value+Quality excess return vs S&P 500 (%)', data: VALUE_QUALITY_EXCESS_BY_YEAR.map((d) => d.excessReturnPct), borderColor: '#2d4a2b', backgroundColor: 'rgba(45, 74, 43, 0.15)', fill: true, tension: 0.2 }]
  }), []);
  const valueQualityExcessChartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
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
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const }, tooltip: { callbacks: { label: (ctx) => ' ' + (ctx.dataset?.label ?? '') + ': ' + (typeof ctx.raw === 'number' ? ctx.raw.toFixed(1) : ctx.raw) + '%' } } },
    scales: { x: { title: { display: true, text: 'Period' }, ticks: { maxTicksLimit: 8 } }, y: { title: { display: true, text: 'Annualized return (%)' }, ticks: { callback: (v) => String(v) + '%' } } }
  }), []);

  const turnoverChartData = useMemo(() => ({
    labels: TURNOVER_VS_NET_RETURN.map((d) => d.quintile),
    datasets: [{ label: 'Net return vs market (%)', data: TURNOVER_VS_NET_RETURN.map((d) => d.netReturnVsMarketPct), backgroundColor: ['#2d4a2b', '#3d5a3b', '#a98a4f', '#c49a5f', '#8b4513'], borderColor: ['#2d4a2b', '#3d5a3b', '#a98a4f', '#c49a5f', '#8b4513'], borderWidth: 1 }]
  }), []);
  const turnoverChartOptions: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => (typeof ctx.raw === 'number' ? ctx.raw.toFixed(1) : ctx.raw) + '% vs market' } } },
    scales: { x: { title: { display: true, text: 'Investor turnover quintile (1 = lowest turnover)' }, ticks: { maxTicksLimit: 6 } }, y: { title: { display: true, text: 'Net return vs market (%)' }, ticks: { callback: (v) => String(v) + '%' } } }
  }), []);

  const concentrationChartData = useMemo(() => ({
    labels: CONCENTRATION_VS_RETURN.map((d) => d.numStocks),
    datasets: [{ label: 'Ann. return (%)', data: CONCENTRATION_VS_RETURN.map((d) => d.annReturnPct), backgroundColor: '#1a2f4a', borderColor: '#1a2f4a', borderWidth: 1 }]
  }), []);
  const concentrationChartOptions: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => (typeof ctx.raw === 'number' ? ctx.raw.toFixed(1) : ctx.raw) + '%' } } },
    scales: { x: { title: { display: true, text: 'Portfolio concentration' }, ticks: { maxTicksLimit: 6 } }, y: { title: { display: true, text: 'Annual return (%)' }, ticks: { callback: (v) => String(v) + '%' } } }
  }), []);

  return (
    <div style={styles.container}>
      <div style={styles.headingRow}>
        <div style={styles.headingLeft}>
          <div style={styles.iconWrap}>
            <img src={COLT_ICON} alt="" style={styles.iconImg} aria-hidden />
          </div>
          <h2 style={styles.pageTitle}>Colt Road&apos;s Research</h2>
        </div>
      </div>

      <p style={styles.researchSummary}>
        Colt Road conducted a rigorous review of over one hundred years of financial market data, peer-reviewed academic research,
        and leading institutional publications to answer three fundamental questions in personal wealth management:

        {' '}(1) What should my asset allocation be, and how should it evolve over time in response to both macroeconomic
        conditions and personal financial factors?
        {' '}(2) Which quantitative metrics and fundamental signals are most reliably correlated with superior long-term
        equity returns?
        {' '}(3) How should I size positions and manage portfolio turnover to maximize after-tax, after-cost performance?
      </p>

      <div style={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            style={activeTab === tab.id ? { ...styles.tab, ...styles.tabActive } : styles.tab}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === 'assetAllocation' && (
          <>
            <h3 style={styles.sectionTitle}>Executive Summary</h3>
            <p style={styles.paragraph}>The era of &quot;set it and forget it&quot; allocation is over. The reliable negative correlation between stocks and bonds that defined the last 40 years has destabilized. We are entering a period of structural volatility, where the optimal portfolio must be engineered not to predict the future, but to survive the bimodal distribution between capital scarcity (inflationary boom) and labor displacement (deflationary bust).</p>
            <p style={styles.paragraph}>Based on our analysis of over a century of market data and the academic literature cited below, we recommend a neutral 50/50 split between equities and debt as the general-purpose default. This allocation effectively operates as a quality equity portfolio backed by a substantial cash-equivalent anchor — prioritizing survival over maximizing beta. Investors with longer compounding horizons (e.g. 20+ years) and higher behavioral risk tolerance may consider tilting toward 60/40 or 70/30 using the portfolio builder&apos;s customizable allocation settings.</p>

            <h3 style={styles.sectionTitle}>I. Valuation Context: CAPE Over Time</h3>
            <p style={styles.paragraph}>For long-term capital deployment, valuation is a probability distribution. Our core metric for equity weightings is the Cyclically Adjusted Price-to-Earnings (CAPE) ratio. Elevated CAPE implies lower expected real returns over the next decade.</p>
            <div style={styles.chartWrap}><Line data={capeChartData} options={capeChartOptions} /></div>
            <p style={styles.hint}>Shiller-style CAPE (S&amp;P 500, 10-year average real earnings). Current levels above 30x suggest real annualized returns of 3–5% for the broad market over the strategic horizon.</p>

            <h3 style={styles.sectionTitle}>II. The Broken Hedge: Stock-Bond Correlation</h3>
            <p style={styles.paragraph}>The most dangerous assumption in modern portfolio theory is that bonds always hedge stocks. When correlation turns positive, both asset classes fall together — bonds are no longer insurance. We reduce duration when correlation stays above 0.3.</p>
            <div style={styles.chartWrap}><Line data={correlationChartData} options={correlationChartOptions} /></div>
            <p style={styles.hint}>10-year rolling correlation of stock and bond returns. Negative (e.g. 1995–2020): bonds rallied when stocks fell. Positive (e.g. 1970s, 2022–present): inflation or supply shocks hit both.</p>

            <h3 style={styles.sectionTitle}>III. The Macro Fork</h3>
            <p style={styles.paragraph}>The optimal equities/debt split is a function of the direction of real interest rates (r*). In Scenario A (Productivity Boom), r* rises and long-duration assets face compression. In Scenario B (Deflationary Bust), r* crashes, deflation crushes revenue, and debasement crushes long bonds. A balanced allocation is the most defensible position until regime clarity emerges.</p>

            <h3 style={styles.sectionTitle}>IV. The Debt Anchor</h3>
            <p style={styles.paragraph}>Because equities are sensitive to rates, the debt tranche serves as a solvency and liquidity reserve. Our strategy is 100% short-duration (1–3 year investment-grade credit and money market), targeting a yield of approximately 5%. In rising-rate regimes, this approach rolls into higher yields; in stress environments, it provides dry powder for opportunistic deployment.</p>
            <p style={styles.paragraph}><strong>Tax-efficiency note:</strong> Investors in taxable accounts — particularly those in high-tax jurisdictions — should evaluate high-grade municipal bonds for the debt sleeve. The tax-equivalent yield (TEY = tax-free yield / (1 − combined marginal rate)) of a quality muni can exceed the after-tax yield of equivalent corporate credit by a meaningful margin. For tax-deferred accounts (IRA, Roth), taxable instruments remain preferred since the tax exemption provides no incremental benefit inside a sheltered wrapper.</p>

            <h3 style={styles.sectionTitle}>V. Trigger Metric: When to Pivot</h3>
            <p style={styles.paragraph}>We maintain 50/50 until the Productivity–Wage Gap confirms the regime. The gap is defined as ΔProductivity − ΔReal Wages. If the gap narrows, we increase equities to 60%. If it widens, we cut equities to 30% and shift debt to government-guaranteed instruments only.</p>
            <p style={styles.paragraph}><strong>High-frequency circuit breakers:</strong> Because BLS productivity and wage data are lagging and subject to revision, we require secondary confirmation from real-time market pricing before executing any regime-driven reallocation within the quarterly review window. Specifically, the Productivity–Wage Gap signal must be corroborated by at least one of: (1) ICE BofA US High Yield Index option-adjusted spread exceeding 500 basis points (credit stress), or (2) the MOVE Index breaching 120 (rate volatility stress). These circuit breakers prevent the portfolio from reallocating on obsolete economic data while preserving the strategic, low-turnover character of the framework.</p>

            <h3 style={styles.sectionTitle}>VI. Historical Evidence: What Mixes Have Worked</h3>
            <p style={styles.paragraph}>Our recommendation is informed by long-run historical regressions. The table below shows 10-year annualized real returns and worst 12-month drawdown for static equity/debt mixes (S&amp;P 500 + intermediate Treasuries).</p>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Equity %</th><th style={styles.th}>Debt %</th><th style={styles.th}>10Y real return (ann.)</th><th style={styles.th}>Worst drawdown</th></tr></thead>
              <tbody>
                {ALLOCATION_HISTORICAL.map((row, i) => (
                  <tr key={i}><td style={styles.td}>{row.equityPct}%</td><td style={styles.td}>{row.debtPct}%</td><td style={styles.td}>{row.realReturn10yPct}%</td><td style={styles.td}>{row.maxDrawdownPct}%</td></tr>
                ))}
              </tbody>
            </table>
            <p style={styles.paragraph}>The 50/50 mix historically captured roughly 75% of the long-run return of 100% equity while cutting the worst drawdown by approximately 40%.</p>

            <h3 style={styles.sectionTitle}>VII. Effectiveness Across Macro Environments</h3>
            <p style={styles.paragraph}>Strategy effectiveness depends on the macro regime. When stocks and bonds were negatively correlated (e.g. 1982–1999), 60/40 and 70/30 outperformed. When both were hit simultaneously (1973–1981 inflation, 2022 rates shock), 50/50 and 40/60 lost less and often delivered the best risk-adjusted outcome.</p>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Regime</th><th style={styles.th}>Period</th><th style={styles.th}>100% E</th><th style={styles.th}>60/40</th><th style={styles.th}>50/50</th><th style={styles.th}>40/60</th><th style={styles.th}>100% D</th></tr></thead>
              <tbody>
                {ALLOCATION_BY_REGIME.map((row, i) => (
                  <tr key={i}><td style={styles.td}>{row.regime}</td><td style={styles.td}>{row.period}</td><td style={styles.td}>{row.r100e}%</td><td style={styles.td}>{row.r6040}%</td><td style={styles.td}>{row.r5050}%</td><td style={styles.td}>{row.r4060}%</td><td style={styles.td}>{row.r0e}%</td></tr>
                ))}
              </tbody>
            </table>

            <h3 style={styles.sectionTitle}>Supporting Data</h3>

            <h3 style={styles.sectionSubhead}>Market metrics (as of {formatMacroDate(macro.asOf)})</h3>
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

            <h3 style={styles.sectionSubhead}>Key ratios: credit vs. equity</h3>
            <div style={styles.ratiosGrid}>
              <div style={styles.ratioCard}><span style={styles.ratioLabel}>Fed model spread</span><span style={styles.ratioValue}>{macro.fedModelSpreadPct >= 0 ? '+' : ''}{macro.fedModelSpreadPct}%</span><span style={styles.ratioHint}>Earnings yield − 10Y Treasury.</span></div>
              <div style={styles.ratioCard}><span style={styles.ratioLabel}>Buffett indicator</span><span style={styles.ratioValue}>{macro.buffettIndicatorPct}%</span><span style={styles.ratioHint}>Market cap / GDP.</span></div>
              <div style={styles.ratioCard}><span style={styles.ratioLabel}>Yield curve (10Y − 2Y)</span><span style={styles.ratioValue}>{macro.yieldCurveSpreadPct >= 0 ? '+' : ''}{macro.yieldCurveSpreadPct}%</span><span style={styles.ratioHint}>Negative = inverted.</span></div>
              <div style={styles.ratioCard}><span style={styles.ratioLabel}>Real 10Y yield</span><span style={styles.ratioValue}>{macro.realTenYearYieldPct >= 0 ? '+' : ''}{macro.realTenYearYieldPct}%</span><span style={styles.ratioHint}>10Y Treasury − CPI.</span></div>
              <div style={styles.ratioCard}><span style={styles.ratioLabel}>Equity risk premium</span><span style={styles.ratioValue}>{macro.equityRiskPremiumEstimatePct}%</span><span style={styles.ratioHint}>Expected excess return of stocks over risk-free.</span></div>
            </div>

            <h3 style={styles.sectionTitle}>Colt Road&apos;s Recommendation</h3>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Asset Class</th><th style={styles.th}>Allocation</th><th style={styles.th}>Strategic Goal</th></tr></thead>
              <tbody>
                <tr><td style={styles.td}>Equities</td><td style={styles.td}>50%</td><td style={styles.td}>Quality growth and inflation-resistant cash flows.</td></tr>
                <tr><td style={styles.td}>Debt</td><td style={styles.td}>50%</td><td style={styles.td}>Preserve principal. Short duration only. Dry powder for volatility.</td></tr>
              </tbody>
            </table>
            <p style={styles.paragraph}>This portfolio is a concentrated quality equity sleeve on top of a substantial cash-equivalent position. It prioritizes capital preservation and optionality over maximizing market beta. Adjustments are made only when trigger metrics confirm a regime shift.</p>
          </>
        )}

        {activeTab === 'stockPicking' && (
          <>
            <h3 style={styles.sectionTitle}>Executive Summary</h3>
            <p style={styles.paragraph}>Colt Road&apos;s stock-selection philosophy is Structural Alpha: we seek micro alpha (superior valuation and fundamentals) inside macro beta (secular growth themes). We do not buy cheap stocks in declining industries. We buy the most efficient, cash-generating operators within the world&apos;s most critical supply chains — then rank them by value, quality, and shareholder yield.</p>
            <p style={styles.paragraph}>Based on our analysis of the peer-reviewed literature and long-run backtests cited below, the result is a concentrated list of 15 names that pass a strict binary gate (Piotroski F-Score ≥ 7, ROIC &gt; WACC, Shareholder Yield &gt; 0) and score highest on our composite ranking.</p>

            <h3 style={styles.sectionTitle}>I. Why Value and Quality Together</h3>
            <p style={styles.paragraph}>The single strongest finding in empirical equity research is that combining cheapness with profitability produces higher risk-adjusted returns than either factor alone. Fama &amp; French (1992, 1993) established the value factor (book-to-market). Novy-Marx (2013), &quot;The Other Side of Value: The Gross Profitability Premium,&quot; Journal of Financial Economics, demonstrated that gross profits-to-assets (GP/Assets) has comparable predictive power and subsumes many quality anomalies. A value+quality composite has delivered roughly 8% annual alpha with a Sharpe ratio near 0.82 in long-run backtests.</p>
            <div style={styles.chartWrap}><Line data={valueQualityExcessChartData} options={valueQualityExcessChartOptions} /></div>
            <p style={styles.hint}>Excess return of a Value+Quality composite strategy vs S&amp;P 500 by year (%). Positive values indicate the strategy outperformed. Sources: Fama-French, Novy-Marx, Greenblatt, Piotroski.</p>

            <h3 style={styles.sectionTitle}>II. The Metrics We Use and the Evidence</h3>
            <p style={styles.paragraph}><strong>Earnings yield (EBIT/EV).</strong> Carlisle (2014), The Acquirer&apos;s Multiple, and Loughran &amp; Wellman (2011), &quot;New Evidence on the Relation between the Enterprise Multiple and Average Stock Returns,&quot; Journal of Financial and Quantitative Analysis, found that the top EBIT/EV quintile delivered 14.6% CAGR vs 9.5% for the S&amp;P 500 over 1973–2017. We use this as our primary value rank, measured as a percentile <em>within the stock&apos;s thematic peer group</em> rather than against the broad market. This sector-relative approach avoids the contradiction of applying an absolute value screen to high-growth sectors where the entire cohort trades at elevated multiples — a 25x multiple may be cheap for AI infrastructure but expensive for legacy manufacturing.</p>
            <p style={styles.paragraph}><strong>Gross profitability (GP/Assets).</strong> Novy-Marx (2013) showed that GP/Assets has equal or greater predictive power than book-to-market. Fama &amp; French later incorporated profitability into their five-factor model. We use this as our primary quality rank.</p>
            <p style={styles.paragraph}><strong>Shareholder yield.</strong> Faber (2022) and practitioner research demonstrate that dividends + net buybacks + debt paydown outperforms dividend yield alone by roughly 200+ basis points and improves down-market resilience. We require Shareholder Yield &gt; 0 and use it in our yield rank.</p>
            <p style={styles.paragraph}><strong>Piotroski F-Score and ROIC − WACC.</strong> Piotroski (2000), &quot;Value Investing: The Use of Historical Financial Statement Information to Separate Winners from Losers,&quot; Journal of Accounting Research, showed that high-F-Score value stocks beat low-F-Score by approximately 23% per year on a long-short basis. Mauboussin &amp; Callahan (2014), &quot;Measuring the Moat,&quot; Credit Suisse, use ROIC − WACC as the value-creation spread. We require F-Score ≥ 7 and ROIC &gt; WACC as binary gates.</p>

            <h3 style={styles.sectionSubhead}>Performance of key metrics over time</h3>
            <p style={styles.paragraph}>The chart below shows annualized returns by period for the top quintile of two core metrics — EBIT/EV (value) and GP/Assets (quality) — versus the S&amp;P 500. In most periods, both quintiles outperformed the market; in stress periods (e.g. 2000–2008), the value and quality tilts provided meaningful downside protection.</p>
            <div style={styles.chartWrap}><Bar data={metricReturnChartData} options={metricReturnChartOptions} /></div>
            <p style={styles.hint}>Annualized return (%) by period. Top EBIT/EV quintile (green), top GP/Assets quintile (blue), S&amp;P 500 (gold). Sources: Loughran &amp; Wellman, Novy-Marx, S&amp;P 500 total return.</p>

            <h3 style={styles.sectionTitle}>III. Scoring Formula</h3>
            <p style={styles.paragraph}>We rank eligible stocks (those that pass the binary gate within our thematic universe) by a weighted composite:</p>
            <div style={styles.formulaBox}>Score = (0.4 × Value Rank) + (0.4 × Quality Rank) + (0.2 × Yield Rank)</div>
            <ul style={styles.list}>
              <li><strong>Value Rank:</strong> Percentile of EBIT/Enterprise Value within the stock&apos;s thematic peer group (sector-relative).</li>
              <li><strong>Quality Rank:</strong> Percentile of Gross Profits / Total Assets (Novy-Marx).</li>
              <li><strong>Yield Rank:</strong> Percentile of Shareholder Yield.</li>
            </ul>
            <div style={styles.chartWrap}><Bar data={structuralAlphaScoreChartData} options={structuralAlphaScoreChartOptions} /></div>
            <p style={styles.hint}>Composite scoring weights. Value and Quality are weighted equally at 40% each, reflecting their comparable predictive power in the literature. Yield receives a 20% weight as a supporting signal.</p>

            <h3 style={styles.sectionTitle}>IV. Thematic Universe</h3>
            <p style={styles.paragraph}>We restrict the investable universe to three secular themes. Only names in these areas are eligible for the quantitative screen. This avoids value traps in declining industries and focuses capital on structural growth.</p>
            <div style={styles.themeCards}>
              <div style={styles.themeCard}><span style={styles.themeCardLabel}>1. AI Physical Infrastructure</span><span style={styles.themeCardDetail}>Data centers, power management, utilities, and critical materials (e.g. copper). Companies that build and power the physical layer of AI and digital infrastructure.</span></div>
              <div style={styles.themeCard}><span style={styles.themeCardLabel}>2. The Silver Economy</span><span style={styles.themeCardDetail}>Healthcare services, MedTech, pharma, and senior living. Demographics (aging populations) drive durable demand regardless of the business cycle.</span></div>
              <div style={styles.themeCard}><span style={styles.themeCardLabel}>3. Industrial Reshoring</span><span style={styles.themeCardDetail}>Automation, logistics, defense, and specialized manufacturing. Supply-chain resilience and onshoring create a long runway for capex and pricing power.</span></div>
            </div>
            <p style={styles.paragraph}>Within this universe, a stock must pass the binary gate: Piotroski F-Score ≥ 7, ROIC &gt; WACC, and Shareholder Yield &gt; 0. We then rank survivors by the 40/40/20 composite and select the top 15.</p>

            <h3 style={styles.sectionTitle}>Colt Road&apos;s Recommendation</h3>
            <p style={styles.paragraph}>The 15 S&amp;P 500 names below best fit the methodology described above. These names are auto-selected in the stock table on the Stock Selection page of the portfolio builder.</p>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>#</th><th style={styles.th}>Name</th><th style={styles.th}>Ticker</th><th style={styles.th}>Theme</th></tr></thead>
              <tbody>
                {COLT_ROAD_BEST_IDEAS.map(({ ticker, name, theme }, idx) => (
                  <tr key={ticker}><td style={styles.td}>{idx + 1}</td><td style={styles.td}>{name}</td><td style={styles.td}>{ticker}</td><td style={styles.td}>{theme}</td></tr>
                ))}
              </tbody>
            </table>
            <p style={styles.paragraph}>This concentrated list is designed to capture micro alpha within macro beta. By combining rigorous quantitative screening with thematic conviction, we aim to deliver superior risk-adjusted returns over a full market cycle.</p>
          </>
        )}

        {activeTab === 'tradingStrategies' && (
          <>
            <h3 style={styles.sectionTitle}>Executive Summary</h3>
            <p style={styles.paragraph}>Colt Road&apos;s view on position sizing and trading is grounded in a consistent finding across the academic and practitioner literature: concentration and conviction outperform diversification and turnover. For a portfolio of high-quality names (e.g. our 15 Best Ideas), we recommend sizing positions by conviction, capping concentration to limit blow-up risk, and trading only when the thesis breaks or allocation drift exceeds a defined rebalance band.</p>
            <p style={styles.paragraph}>Based on our analysis of the peer-reviewed research cited below, the optimal approach for most investors is a low-turnover, conviction-weighted portfolio that minimizes tax drag and transaction costs.</p>

            <h3 style={styles.sectionTitle}>I. Turnover and Underperformance</h3>
            <p style={styles.paragraph}>Barber &amp; Odean (2000), &quot;Trading Is Hazardous to Your Wealth,&quot; Journal of Finance, studied 66,000 households at a large discount broker. They found that the average individual investor underperformed the market by 3.7% per year; the most active traders (highest turnover quintile) underperformed by roughly 5–6% per year. Barber &amp; Odean (2001), &quot;Boys Will Be Boys,&quot; Quarterly Journal of Economics, showed that overconfidence drives excess trading, and that higher-turnover investors earn consistently lower net returns.</p>
            <div style={styles.chartWrap}><Bar data={turnoverChartData} options={turnoverChartOptions} /></div>
            <p style={styles.hint}>Net return vs market by turnover quintile. Lowest turnover (left) slightly beats the market; highest turnover (right) underperforms by approximately 5% per year. Sources: Barber &amp; Odean (2000, 2001); FCA (UK) retail-investor studies.</p>

            <h3 style={styles.sectionTitle}>II. Concentration and Patient Capital</h3>
            <p style={styles.paragraph}>Cremers &amp; Pareek (2016), &quot;Patient Capital Outperformance: The Investment Skill of High Active Share Managers Who Trade Infrequently,&quot; Journal of Financial Economics, showed that managers who hold stocks for longer (patient capital) and have high active share (concentrated, differentiated portfolios) deliver stronger after-fee alpha. Kacperczyk, Sialm &amp; Zheng (2005), &quot;On the Industry Concentration of Actively Managed Equity Mutual Funds,&quot; Journal of Finance, found that more concentrated funds tend to outperform. Industry data from Morningstar and academic work support that a focused list of 10–20 high-conviction names, rebalanced infrequently, can capture more of a stock-picking edge than a diversified, high-turnover approach.</p>
            <div style={styles.chartWrap}><Bar data={concentrationChartData} options={concentrationChartOptions} /></div>
            <p style={styles.hint}>Conceptual annual return by portfolio concentration. Concentrated, conviction-weighted portfolios (e.g. 5–15 names) with low turnover have historically captured more alpha when combined with a disciplined selection process. Sources: Cremers &amp; Pareek (2016); industry concentration studies.</p>

            <h3 style={styles.sectionTitle}>III. Tax Drag and Rebalancing</h3>
            <p style={styles.paragraph}>Dammon, Spatt &amp; Zhang (2004), &quot;Optimal Asset Location and Allocation with Taxable and Tax-Deferred Investing,&quot; Journal of Finance, and practitioner research (e.g. Vanguard, Schwab) show that frequent rebalancing in taxable accounts triggers short-term capital gains and erodes after-tax returns. Long-term buy-and-hold strategies and rebalancing only when drift exceeds a band (e.g. ±25% from target) substantially reduce tax drag.</p>
            <p style={styles.paragraph}>S&amp;P Dow Jones and Russell index methodology documents further emphasize that lower-turnover indices (e.g. low-volatility or quality tilts with infrequent reconstitution) tend to have lower implementation drag — consistent with our recommendation to trade only when the thesis breaks or allocation drift is material.</p>

            <h3 style={styles.sectionTitle}>IV. Position Sizing Framework</h3>
            <p style={styles.paragraph}>Equal-weight is a reasonable default, but conviction weighting (larger positions in higher-conviction ideas) improves risk-adjusted returns when the investor has genuine edge — as demonstrated in Cremers &amp; Pareek (2016). We recommend capping any single position at 10–15% of equity to avoid concentration blow-up risk. Rebalance only when a position drifts meaningfully from target or when the fundamental thesis changes.</p>
            <p style={styles.paragraph}>Specifically, a position should be liquidated when any of the following quantitative thresholds are breached at the quarterly review:</p>
            <ul style={styles.list}>
              <li><strong>Fundamental deterioration:</strong> Piotroski F-Score falls below 5 (from a required entry gate of ≥ 7).</li>
              <li><strong>Moat erosion:</strong> ROIC falls below WACC for two consecutive quarters, indicating the business is no longer creating economic value.</li>
              <li><strong>Capital allocation reversal:</strong> Shareholder Yield turns negative (the company is diluting shareholders rather than returning capital).</li>
              <li><strong>Concentration breach:</strong> Position weight exceeds 15% of total equity allocation (risk management cap).</li>
              <li><strong>Drift rebalance:</strong> Position weight deviates more than ±25% from its target weight.</li>
            </ul>
            <p style={styles.paragraph}>Outside of these triggers, we advise against trading on price action alone. Momentum and mean-reversion strategies add turnover and tax liability that erode net returns for most individual investors.</p>

            <h3 style={styles.sectionTitle}>Colt Road&apos;s Recommendation</h3>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Parameter</th><th style={styles.th}>Recommendation</th><th style={styles.th}>Rationale</th></tr></thead>
              <tbody>
                <tr><td style={styles.td}>Default weighting</td><td style={styles.td}>Equal-weight</td><td style={styles.td}>Simple, diversified baseline for most investors.</td></tr>
                <tr><td style={styles.td}>Max position size</td><td style={styles.td}>10–15% of equity</td><td style={styles.td}>Limits single-name blow-up risk.</td></tr>
                <tr><td style={styles.td}>Rebalance trigger</td><td style={styles.td}>±25% drift from target</td><td style={styles.td}>Minimizes tax drag and turnover costs.</td></tr>
                <tr><td style={styles.td}>Sell trigger</td><td style={styles.td}>F-Score &lt; 5, ROIC &lt; WACC (2 qtrs), or negative shareholder yield</td><td style={styles.td}>Quantifiable thesis-break thresholds; avoids overtrading.</td></tr>
                <tr><td style={styles.td}>Preferred account type</td><td style={styles.td}>Tax-deferred (IRA/Roth)</td><td style={styles.td}>Eliminates short-term capital gains drag.</td></tr>
              </tbody>
            </table>
            <p style={styles.paragraph}>The optimal trading strategy for most individual investors is discipline, not activity. A low-turnover, conviction-weighted portfolio of quality names — supported by the evidence from Barber &amp; Odean (turnover destroys value), Cremers &amp; Pareek (patient, concentrated capital wins), and Dammon et al. (tax-aware rebalancing) — is designed to maximize after-tax, after-cost returns over a full market cycle.</p>
          </>
        )}
      </div>

      <div style={styles.footerActions}>
        <button style={styles.btnBack} onClick={onBack}>Back to Home</button>
        <button style={styles.btnStartPortfolio} onClick={onStartPortfolio}>Customize Your Portfolio</button>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem 4rem' },
  headingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
    background: '#0f1f35',
    padding: '0.5rem 1.5rem'
  },
  headingLeft: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  iconWrap: {
    width: '36px',
    height: '36px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconImg: { width: '100%', height: '100%', objectFit: 'contain', filter: 'invert(1)', mixBlendMode: 'lighten' as const },
  pageTitle: {
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0
  },
  researchSummary: {
    fontSize: '0.95rem',
    color: '#2c2c2c',
    lineHeight: 1.7,
    margin: '0 0 1.5rem 0',
    padding: '1rem 1.25rem',
    background: '#fbf9f4',
    border: '1px solid rgba(168, 155, 132, 0.4)'
  },
  tabBar: { display: 'flex', gap: '0', borderBottom: '3px solid #0f1f35', marginBottom: '2rem' },
  tab: {
    flex: 1,
    padding: '0.85rem 1.5rem',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '1rem',
    fontWeight: 600,
    color: '#6d6658',
    background: '#f0ede5',
    border: '2px solid #d9d2c1',
    borderBottom: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    marginBottom: '-3px'
  },
  tabActive: {
    color: '#ffffff',
    background: '#0f1f35',
    borderColor: '#0f1f35',
    borderBottom: '3px solid #0f1f35'
  },
  content: { background: '#fbf9f4', border: '1px solid rgba(168, 155, 132, 0.4)', padding: '0 3rem 2.5rem', marginBottom: '2rem' },
  sectionTitle: { fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '1.25rem', fontWeight: 700, color: '#0f1f35', marginTop: '2rem', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '2px solid #d9d2c1' },
  sectionSubhead: { fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '1.1rem', fontWeight: 400, color: '#0f1f35', marginTop: '1.5rem', marginBottom: '0.5rem', paddingBottom: '0.35rem', borderBottom: '1px solid #d9d2c1' },
  subsectionTitle: { fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '1.35rem', color: '#0f1f35', marginTop: '2rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '2px solid #d9d2c1' },
  scopeNote: { fontSize: '0.9rem', color: '#0f1f35', lineHeight: 1.5, margin: '0 0 1.25rem 0', padding: '0.85rem', background: 'rgba(169, 138, 79, 0.12)', border: '1px solid rgba(169, 138, 79, 0.4)', borderRadius: '4px' },
  paragraph: { fontSize: '0.95rem', color: '#2c2c2c', lineHeight: 1.7, margin: '0 0 1rem 0' },
  hint: { fontSize: '0.9rem', color: '#6d6658', marginBottom: '1.25rem', lineHeight: 1.5 },
  chartWrap: { height: '280px', margin: '1.25rem 0' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '1.25rem' },
  th: { textAlign: 'left', padding: '0.6rem 0.85rem', borderBottom: '2px solid #0f1f35', color: '#0f1f35', fontWeight: 600 },
  td: { padding: '0.6rem 0.85rem', borderBottom: '1px solid #d9d2c1', color: '#2c2c2c', verticalAlign: 'top' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  statCard: { background: 'white', border: '2px solid #d9d2c1', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  statLabel: { fontSize: '0.8rem', color: '#6d6658', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 600 },
  statValue: { fontSize: '1.25rem', fontWeight: 700, color: '#0f1f35' },
  statHint: { fontSize: '0.8rem', color: '#6d6658', lineHeight: 1.3 },
  erpChartWrap: { height: '320px', marginBottom: '1.5rem', padding: '1.25rem', background: '#f5f2e9' },
  ratiosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  ratioCard: { background: 'white', border: '2px solid #d9d2c1', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  ratioLabel: { fontSize: '0.8rem', color: '#6d6658', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 600 },
  ratioValue: { fontSize: '1.25rem', fontWeight: 700, color: '#0f1f35' },
  ratioHint: { fontSize: '0.82rem', color: '#6d6658', lineHeight: 1.4 },
  formulaBox: { background: '#f0ede5', border: '2px solid #a98a4f', padding: '1.25rem 1.5rem', fontFamily: 'monospace', fontSize: '1.15rem', color: '#0f1f35', marginBottom: '1rem', borderRadius: '4px' },
  list: { margin: '0 0 1rem 0', paddingLeft: '1.5rem', fontSize: '0.95rem', color: '#2c2c2c', lineHeight: 1.7 },
  themeCards: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' },
  themeCard: { background: 'linear-gradient(135deg, rgba(45, 74, 43, 0.08) 0%, rgba(26, 47, 74, 0.08) 100%)', border: '2px solid #d9d2c1', padding: '1rem 1.25rem', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  themeCardLabel: { fontWeight: 700, color: '#0f1f35', fontSize: '0.95rem' },
  themeCardDetail: { fontSize: '0.88rem', color: '#6d6658', lineHeight: 1.4 },
  bestIdeasList: { margin: '0 0 1rem 0', paddingLeft: '1.5rem', fontSize: '0.95rem', color: '#2c2c2c', lineHeight: 1.65 },
  bestIdeasItem: { marginBottom: '0.4rem' },
  footerActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem' },
  btnBack: {
    background: 'white',
    color: '#0f1f35',
    border: '2px solid #0f1f35',
    padding: '0.85rem 2rem',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    borderRadius: 0
  },
  btnStartPortfolio: {
    background: 'linear-gradient(135deg, #2d4a2b 0%, #3d5a3c 100%)',
    color: '#f5f2e9',
    border: '2px solid #1f3622',
    padding: '0.85rem 2rem',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    boxShadow: '0 4px 16px rgba(45, 74, 43, 0.3)',
    borderRadius: 0
  }
};
