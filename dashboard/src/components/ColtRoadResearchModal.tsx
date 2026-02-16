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
import { CAPE_BY_YEAR, STOCK_BOND_CORRELATION } from '../data/researchCharts';
import { aiRecommendationHistory, getQuarterLabel, getQuarterlyRecommendationHistory } from '../data/aiRecommendationHistory';
import { fetchMacroSnapshot, getDefaultMacroSnapshot } from '../services/macroApi';

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

export interface ColtRoadResearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ColtRoadResearchModal({ open, onClose }: ColtRoadResearchModalProps) {
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

  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="research-title">
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 id="research-title" style={styles.title}>Colt Road&apos;s Research</h2>
          <button type="button" onClick={onClose} style={styles.closeBtn} aria-label="Close">×</button>
        </div>
        <div style={styles.body}>
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

          <h3 style={styles.sectionTitle}>Stock Selection: The Ironclad Portfolio</h3>
          <p style={styles.paragraph}>We do not conflate structural themes with venture-style risk. In a world of geopolitical fragmentation and valuation extremes, unproven tech or volatile commodities violate the first rule of compounding: do not lose money.</p>
          <p style={styles.paragraph}>We have scrubbed the equity universe of <strong>Speculation</strong> (unproven tech), <strong>Valuation Extremes</strong> (&gt;40× P/E without guarantees), and <strong>Geopolitical Fragility</strong> (assets in conflict zones). What remains is the &quot;Ironclad&quot; portfolio: digital utilities, physical monopolies, and sovereign contractors that monetize capital scarcity through irreplaceable assets and regulatory moats.</p>

          <h3 style={styles.sectionTitle}>Theme I: Digital Utilities (Un-Disruptable Scale)</h3>
          <p style={styles.paragraph}>We keep the infrastructure owners. If the AI revolution happens, they tax it; if it fails, they still run the global economy.</p>
          <p style={styles.paragraph}><strong>Microsoft (MSFT).</strong> The moat is integration: Cloud (Azure), OS (Windows), and Productivity (Office). You cannot rip and replace Microsoft without shutting down the company. Balance sheet can weather any &quot;AI Winter.&quot;</p>
          <p style={styles.paragraph}><strong>Alphabet (GOOGL).</strong> Search is the internet&apos;s nervous system. Often trading at a discount to the S&P 500 (&lt;20× P/E), it is the cheapest quality asset in tech. YouTube and Android provide a floor that speculative AI names lack.</p>
          <p style={styles.paragraph}><strong>Amazon (AMZN).</strong> The moat is logistics. You cannot replicate warehouses, trucks, and planes without $200B and 20 years. They are the railroad of the digital age. AWS provides the profit; logistics provides the moat.</p>

          <h3 style={styles.sectionTitle}>Theme II: Physical Monopolies (Hard Moats)</h3>
          <p style={styles.paragraph}>These companies own assets that are legally or physically impossible to replicate.</p>
          <p style={styles.paragraph}><strong>Waste Management (WM).</strong> NIMBY: permits for new landfills are effectively impossible. WM owns scarcity of trash capacity. They also monetize methane (RNG) from landfills. Recession-proof and inflation-protected.</p>
          <p style={styles.paragraph}><strong>Canadian Pacific Kansas City (CP).</strong> The only single-line rail network connecting Canada, the U.S., and Mexico. In a de-globalizing world, North American supply chains are fusing. You cannot build a new railroad. Absolute pricing power on the north-south corridor.</p>
          <p style={styles.paragraph}><strong>Linde (LIN).</strong> Embedded infrastructure: industrial gas plants on the customer&apos;s site with 10–20 year &quot;take-or-pay&quot; contracts. They pass through energy and inflation. The closest thing to a guaranteed return in industrials.</p>
          <p style={styles.paragraph}><strong>Sherwin-Williams (SHW).</strong> Controlled distribution: 5,000+ owned stores versus competitors who sell through Home Depot. They control the pro-contractor relationship and have margins and pricing power that manufacturing-only rivals cannot match.</p>

          <h3 style={styles.sectionTitle}>Theme III: Sovereign &amp; Critical Infrastructure</h3>
          <p style={styles.paragraph}>We favor US-domiciled defense and infrastructure over chip names with China risk.</p>
          <p style={styles.paragraph}><strong>General Dynamics (GD).</strong> Nuclear submarines. One customer (US Navy), effectively one provider. Subs are critical national secrets; backlog is filled for decades. Geopolitical hedge without export-control risk.</p>
          <p style={styles.paragraph}><strong>Lockheed Martin (LMT).</strong> The F-35 is the backbone of NATO air power; switching costs are infinite. Global defense spending is in a secular bull market. LMT is the blue chip of the sector with a reliable dividend.</p>
          <p style={styles.paragraph}><strong>TransDigm (TDG).</strong> FAA-certified proprietary aircraft parts; once certified, airlines must use them. They buy sole-source parts makers and raise prices. Margins ~50%. The most efficient cash-flow machine in aerospace.</p>
          <p style={styles.paragraph}><strong>Eaton (ETN).</strong> Electrical backbone for the US grid. The grid is ~50 years old and must be rebuilt for AI/EVs. Eaton sells the switchgear and transformers every utility needs—the arms dealer for electrification.</p>

          <h3 style={styles.sectionTitle}>Theme IV: Sleep-Well Anchors (Oligopolies)</h3>
          <p style={styles.paragraph}><strong>Cencora (COR).</strong> With McKesson and Cardinal, they control ~90% of US drug distribution. Pharma volume grows regardless of the economy. Razor-thin margins, massive volume, and a barrier to entry no tech disruptor can cross.</p>
          <p style={styles.paragraph}><strong>Berkshire Hathaway (BRK.B).</strong> Fortress balance sheet. If the market crashes, $150B+ in cash to buy quality assets at distress prices. If it booms, energy and rail (BNSF) participate. The ultimate hedge.</p>
          <p style={styles.paragraph}><strong>Verisk Analytics (VRSK).</strong> Data contributory consortium: insurers give data to Verisk; Verisk aggregates and sells analytics back. No insurer can price risk accurately without Verisk. Subscription model with near-zero churn and no geopolitical exposure.</p>

          <h3 style={styles.sectionTitle}>Risk Audit: Ironclad vs. Speculative Portfolio</h3>
          <table style={styles.table}>
            <thead>
              <tr><th style={styles.th}>Risk Factor</th><th style={styles.th}>Speculative Portfolio</th><th style={styles.th}>Ironclad Portfolio</th></tr>
            </thead>
            <tbody>
              <tr><td style={styles.td}>Geopolitics</td><td style={styles.td}>High (e.g. Taiwan chip exposure)</td><td style={styles.td}>Low (US-centric rail, waste, defense)</td></tr>
              <tr><td style={styles.td}>Valuation</td><td style={styles.td}>High (e.g. &gt;100× P/E)</td><td style={styles.td}>Moderate (e.g. GOOGL ~20×, LMT ~17×)</td></tr>
              <tr><td style={styles.td}>Speculation</td><td style={styles.td}>High (unproven cash flows)</td><td style={styles.td}>Zero (proven cash flows only)</td></tr>
            </tbody>
          </table>
          <p style={styles.paragraph}><strong>Final word.</strong> This portfolio accepts lower hypothetical upside (no 10× baggers) in exchange for a higher probability of survival. It owns the infrastructure of the economy—data, trash, rail, power, and defense—that will exist in 2035 regardless of who wins the AI race.</p>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 31, 53, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' },
  modal: { background: '#f8f6f0', border: '2px solid #d9d2c1', borderRadius: '8px', maxWidth: '720px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '2px solid #d9d2c1', background: '#f0ede5', flexShrink: 0 },
  title: { margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f1f35', fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem', color: '#6d6658', cursor: 'pointer', padding: '0.25rem' },
  body: { overflowY: 'auto', padding: '1.25rem', flex: '1 1 auto', minHeight: 0 },
  sectionTitle: { fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#0f1f35', marginTop: '1.5rem', marginBottom: '0.5rem', paddingBottom: '0.35rem', borderBottom: '1px solid #d9d2c1' },
  paragraph: { fontSize: '0.9rem', color: '#2c2c2c', lineHeight: 1.6, margin: '0 0 0.75rem 0' },
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
