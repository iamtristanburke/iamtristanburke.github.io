import { useMemo, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Config, PersonalFactors, MarketMacroSnapshot } from '../types/colt-road';
import ProgressBar from '../components/ProgressBar';
import Section from '../components/Section';
import FormGroup from '../components/FormGroup';
import ButtonGroup from '../components/ButtonGroup';
import { formatNumber } from '../utils/formatters';
import { aiRecommendationHistory, getQuarterLabel, getQuarterlyRecommendationHistory } from '../data/aiRecommendationHistory';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/** Placeholder macro snapshot; replace with API or config for regularly updated stats and daily commentary. */
const defaultMacroSnapshot: MarketMacroSnapshot = {
  asOf: '2025-02-15',
  dailyCommentary: 'Rates hold near recent ranges with the 10-year at 4.25% and the curve slightly inverted (10Y–2Y about –27 bps). Equity valuations remain full by historical standards: the Fed model (earnings yield vs. 10Y) is only modestly positive, and the Buffett indicator sits above 180%, suggesting stocks are not cheap relative to the economy. Real 10Y yields are positive after inflation, so bonds offer meaningful real income. For allocation, Colt Road sees a backdrop that supports a balanced stock/bond mix—favoring quality and duration in bonds and avoiding over-allocation to equity when risk premia are compressed.',
  tenYearTreasuryYieldPct: 4.25,
  twoYearTreasuryYieldPct: 4.52,
  sp500ForwardPE: 21.2,
  equityRiskPremiumEstimatePct: 3.8,
  fedFundsRatePct: 4.50,
  inflationCpiYoYPct: 2.9,
  investmentGradeCorpSpreadBps: 95,
  dividendYieldSp500Pct: 1.35,
  earningsYieldSp500Pct: 4.72,   // 100 / 21.2
  fedModelSpreadPct: 0.47,        // 4.72 - 4.25
  buffettIndicatorPct: 182,
  yieldCurveSpreadPct: -0.27,    // 4.25 - 4.52
  realTenYearYieldPct: 1.35,     // 4.25 - 2.9
  aiBaselineEquityPct: 55,
  aiBaselineRationale: 'Given compressed equity risk premia, full valuations, and positive real bond yields, we recommend a baseline of 55% stocks / 45% bonds. Your answers below will amend this to fit your horizon and risk tolerance.'
};

/** Derive suggested equity % from Colt Road baseline + personal amendments; steps list amendments. */
function deriveSuggestedAllocation(pf: PersonalFactors, aiBaselineEquityPct: number): { pct: number; steps: string[] } {
  const steps: string[] = [];
  let pct = aiBaselineEquityPct;
  steps.push(`Colt Road baseline (from macro): ${pct}% stocks`);

  const riskDelta = pf.riskAppetite === 'conservative' ? -15 : pf.riskAppetite === 'moderate' ? 0 : 15;
  const riskLabel = pf.riskAppetite.charAt(0).toUpperCase() + pf.riskAppetite.slice(1);
  if (riskDelta !== 0) {
    pct += riskDelta;
    steps.push(`Risk appetite (${riskLabel}): ${riskDelta > 0 ? '+' : ''}${riskDelta}%`);
  } else {
    steps.push(`Risk appetite (${riskLabel}): no change`);
  }

  if (pf.maxAcceptableLossPct <= 10) {
    pct -= 10;
    steps.push(`Max loss tolerance ≤10%: −10% (more bonds)`);
  } else if (pf.maxAcceptableLossPct >= 25) {
    pct += 5;
    steps.push(`Max loss tolerance ≥25%: +5% (more stocks)`);
  } else {
    steps.push(`Max loss tolerance ${pf.maxAcceptableLossPct}%: no change`);
  }

  if (pf.ifPortfolioDropped20 === 'sell') {
    pct -= 25;
    steps.push(`If portfolio dropped 20% (sell): −25%`);
  } else if (pf.ifPortfolioDropped20 === 'reduce') {
    pct -= 10;
    steps.push(`If portfolio dropped 20% (reduce): −10%`);
  } else if (pf.ifPortfolioDropped20 === 'add') {
    pct += 5;
    steps.push(`If portfolio dropped 20% (add): +5%`);
  } else {
    steps.push(`If portfolio dropped 20% (hold): no change`);
  }

  if (pf.avoidShortTermLosses === 'very') {
    pct -= 15;
    steps.push(`Avoid short-term losses (very): −15%`);
  } else if (pf.avoidShortTermLosses === 'notVery') {
    pct += 5;
    steps.push(`Avoid short-term losses (not very): +5%`);
  } else {
    steps.push(`Avoid short-term losses (somewhat): no change`);
  }

  if (pf.timeHorizonYears >= 25) {
    pct += 5;
    steps.push(`Time horizon ≥25 years: +5%`);
  } else if (pf.timeHorizonYears >= 15) {
    pct += 5;
    steps.push(`Time horizon ≥15 years: +5%`);
  } else {
    steps.push(`Time horizon ${pf.timeHorizonYears} years: no change`);
  }

  if (pf.age < 40) {
    pct += 5;
    steps.push('Age under 40: +5%');
  } else if (pf.age > 60) {
    pct -= 5;
    steps.push('Age over 60: −5%');
  } else {
    steps.push(`Age ${pf.age}: no change`);
  }

  // Higher % of assets in this liquid portfolio → more conservative (more bonds)
  if (pf.pctOfAssetsInLiquidPortfolio === 100) {
    pct -= 10;
    steps.push('Most assets in this portfolio (75%+): −10% (more conservative)');
  } else if (pf.pctOfAssetsInLiquidPortfolio === 75) {
    pct -= 5;
    steps.push('50–75% of assets in this portfolio: −5%');
  } else if (pf.pctOfAssetsInLiquidPortfolio === 25) {
    pct += 5;
    steps.push('Less than 25% of assets here: +5% (can take more risk)');
  } else {
    steps.push('25–50% of assets in this portfolio: no change');
  }

  pct = Math.max(10, Math.min(95, Math.round(pct)));
  steps.push(`→ Rounded to ${pct}% stocks / ${100 - pct}% bonds`);
  return { pct, steps };
}

interface ProfilePageProps {
  config: Config;
  updateConfig: (key: keyof Config, value: any) => void;
  onNext: () => void;
  onBack: () => void;
  onStepClick?: (step: number) => void;
}

const defaultPersonal: PersonalFactors = {
  timeHorizonYears: 10,
  age: 45,
  riskAppetite: 'moderate',
  maxAcceptableLossPct: 15,
  ifPortfolioDropped20: 'hold',
  avoidShortTermLosses: 'somewhat',
  pctOfAssetsInLiquidPortfolio: 50,
  realEstateValue: 0,
  alternativeInvestmentsValue: 0
};

function formatMacroDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
}

/** e.g. "February 15th, 2026" for headline */
function formatPerspectiveDate(iso: string): string {
  try {
    const d = new Date(iso);
    const day = d.getDate();
    const ord = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    const year = d.getFullYear();
    return `${month} ${day}${ord}, ${year}`;
  } catch {
    return iso;
  }
}

/** e.g. "February 15th" for update title */
function formatUpdateDate(iso: string): string {
  try {
    const d = new Date(iso);
    const day = d.getDate();
    const ord = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    return `${month} ${day}${ord}`;
  } catch {
    return iso;
  }
}

export default function ProfilePage({ config, updateConfig, onNext, onBack, onStepClick }: ProfilePageProps) {
  const pf = config.personalFactors ?? defaultPersonal;
  const macro = defaultMacroSnapshot; // TODO: from config.marketMacroSnapshot or API for regularly updated stats
  const { pct: suggestedEquityPct, steps: calculationSteps } = useMemo(
    () => deriveSuggestedAllocation(pf, macro.aiBaselineEquityPct),
    [pf, macro.aiBaselineEquityPct]
  );

  useEffect(() => {
    updateConfig('targetEquityPct', suggestedEquityPct);
  }, [suggestedEquityPct]);

  const updatePersonal = (key: keyof PersonalFactors, value: any) => {
    const next = { ...pf, [key]: value };
    updateConfig('personalFactors', next);
    updateConfig('targetEquityPct', deriveSuggestedAllocation(next, macro.aiBaselineEquityPct).pct);
  };

  const setPortfolioValue = (value: number) => {
    updateConfig('portfolioValue', value);
  };

  const chartFontFamily = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
  const chartTextColor = '#0f1f35';
  const chartSubduedColor = '#6d6658';

  const quarterlyHistory = useMemo(() => getQuarterlyRecommendationHistory(aiRecommendationHistory), []);

  const recommendationChartData = useMemo(() => ({
    labels: quarterlyHistory.map((d) => getQuarterLabel(d.year, d.month)),
    datasets: [
      {
        label: 'Stocks',
        data: quarterlyHistory.map((d) => d.suggestedEquityPct),
        backgroundColor: 'rgba(45, 74, 43, 0.22)',
        borderColor: '#2d4a2b',
        borderWidth: 2.5
      },
      {
        label: 'Bonds',
        data: quarterlyHistory.map((d) => 100 - d.suggestedEquityPct),
        backgroundColor: 'rgba(26, 47, 74, 0.22)',
        borderColor: '#1a2f4a',
        borderWidth: 2.5
      }
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
        bodySpacing: 6,
        titleSpacing: 4,
        displayColors: true,
        boxPadding: 6,
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
      legend: {
        position: 'bottom',
        labels: {
          font: { family: chartFontFamily, size: 13, weight: 'bold' },
          color: chartTextColor,
          padding: 14,
          usePointStyle: false,
          boxWidth: 18,
          boxHeight: 14
        }
      }
    },
    layout: {
      padding: { bottom: 8, top: 12, left: 4, right: 4 }
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        title: {
          display: true,
          text: 'Quarter',
          font: { family: chartFontFamily, size: 13, weight: 'bold' },
          color: chartSubduedColor,
          padding: { top: 8 }
        },
        ticks: {
          maxTicksLimit: 12,
          maxRotation: 50,
          minRotation: 45,
          font: { family: chartFontFamily, size: 12 },
          color: chartSubduedColor,
          autoSkip: true,
          autoSkipPadding: 8
        }
      },
      y: {
        stacked: true,
        grid: { display: false },
        min: 0,
        max: 100,
        title: {
          display: true,
          text: '% of portfolio',
          font: { family: chartFontFamily, size: 13, weight: 'bold' },
          color: chartSubduedColor
        },
        ticks: {
          font: { family: chartFontFamily, size: 12 },
          color: chartSubduedColor,
          callback: (value) => (typeof value === 'number' ? `${value}%` : value),
          stepSize: 25
        }
      }
    }
  }), [quarterlyHistory]);

  return (
    <div style={styles.container} className="page-container">
      <ProgressBar current={2} onStepClick={onStepClick} />

      {/* ——— Section 1: Colt Road's perspective on debt/equity (dynamic date) ——— */}
      <Section title={`Debt and Equity Allocations as of ${formatPerspectiveDate(macro.asOf)}`}>
        <h3 style={styles.subsectionTitle}>Colt Road's daily perspective on base stock/bond split</h3>
        <div style={styles.aiBaselineBlock}>
          <div style={styles.aiBaselineBar}>
            <div style={{ ...styles.aiBaselineSegment, width: `${macro.aiBaselineEquityPct}%` }}>
              <span style={styles.aiBaselineLabel}>{macro.aiBaselineEquityPct}% Stocks</span>
            </div>
            <div style={{ ...styles.aiBaselineSegment, width: `${100 - macro.aiBaselineEquityPct}%`, backgroundColor: '#1a2f4a' }}>
              <span style={styles.aiBaselineLabel}>{100 - macro.aiBaselineEquityPct}% Bonds</span>
            </div>
          </div>
          <p style={styles.aiBaselineRationale}>{macro.aiBaselineRationale}</p>
        </div>

        <h3 style={styles.subsectionTitle}>Colt Road {formatUpdateDate(macro.asOf)} Update and Key Metrics</h3>
        <p style={styles.updateAndMetricsBlurb}>{macro.dailyCommentary}</p>
        <p style={styles.macroAsOf}>Data as of {formatMacroDate(macro.asOf)}. Connect a data source or update inputs to keep figures current.</p>
        <div style={styles.macroStatsGrid}>
          <div style={styles.macroStatCard}>
            <span style={styles.macroStatLabel}>10-year Treasury yield</span>
            <span style={styles.macroStatValue}>{macro.tenYearTreasuryYieldPct}%</span>
            <span style={styles.macroStatHint}>Nominal risk-free benchmark</span>
          </div>
          <div style={styles.macroStatCard}>
            <span style={styles.macroStatLabel}>2-year Treasury yield</span>
            <span style={styles.macroStatValue}>{macro.twoYearTreasuryYieldPct}%</span>
            <span style={styles.macroStatHint}>Short-term rate</span>
          </div>
          <div style={styles.macroStatCard}>
            <span style={styles.macroStatLabel}>S&P 500 forward P/E</span>
            <span style={styles.macroStatValue}>{macro.sp500ForwardPE}×</span>
            <span style={styles.macroStatHint}>Equity valuation</span>
          </div>
          <div style={styles.macroStatCard}>
            <span style={styles.macroStatLabel}>S&P 500 earnings yield</span>
            <span style={styles.macroStatValue}>{macro.earningsYieldSp500Pct}%</span>
            <span style={styles.macroStatHint}>100 ÷ P/E (Fed model input)</span>
          </div>
          <div style={styles.macroStatCard}>
            <span style={styles.macroStatLabel}>Equity risk premium (est.)</span>
            <span style={styles.macroStatValue}>{macro.equityRiskPremiumEstimatePct}%</span>
            <span style={styles.macroStatHint}>Stocks vs risk-free</span>
          </div>
          <div style={styles.macroStatCard}>
            <span style={styles.macroStatLabel}>S&P 500 dividend yield</span>
            <span style={styles.macroStatValue}>{macro.dividendYieldSp500Pct}%</span>
            <span style={styles.macroStatHint}>Income from equities</span>
          </div>
          <div style={styles.macroStatCard}>
            <span style={styles.macroStatLabel}>Fed funds rate</span>
            <span style={styles.macroStatValue}>{macro.fedFundsRatePct}%</span>
            <span style={styles.macroStatHint}>Policy rate</span>
          </div>
          <div style={styles.macroStatCard}>
            <span style={styles.macroStatLabel}>CPI inflation (y/y)</span>
            <span style={styles.macroStatValue}>{macro.inflationCpiYoYPct}%</span>
            <span style={styles.macroStatHint}>Real yield context</span>
          </div>
          <div style={styles.macroStatCard}>
            <span style={styles.macroStatLabel}>IG corporate spread</span>
            <span style={styles.macroStatValue}>{macro.investmentGradeCorpSpreadBps} bps</span>
            <span style={styles.macroStatHint}>Credit vs Treasuries</span>
          </div>
        </div>

        <h3 style={styles.subsectionTitle}>Colt Road's Recommendation Over Time</h3>
        <p style={styles.ratiosHint}>Recommended stocks % (green) and bonds % (blue) each quarter. Latest bar matches the current recommendation above.</p>
        <div style={styles.erpChartWrapper}>
          <Bar data={recommendationChartData} options={recommendationChartOptions} />
        </div>

        <h3 style={styles.subsectionTitle}>Key ratios: credit vs. equity</h3>
        <p style={styles.ratiosHint}>Traditional gauges used by leading economists and investors to compare bonds and stocks.</p>
        <div style={styles.ratiosGrid}>
          <div style={styles.ratioCard}>
            <span style={styles.ratioLabel}>Fed model spread</span>
            <span style={styles.ratioValue}>{macro.fedModelSpreadPct >= 0 ? '+' : ''}{macro.fedModelSpreadPct}%</span>
            <span style={styles.ratioHint}>Earnings yield − 10Y Treasury. Positive = stocks favored vs bonds.</span>
          </div>
          <div style={styles.ratioCard}>
            <span style={styles.ratioLabel}>Buffett indicator</span>
            <span style={styles.ratioValue}>{macro.buffettIndicatorPct}%</span>
            <span style={styles.ratioHint}>Market cap / GDP. ~100% fair; &gt;100% expensive.</span>
          </div>
          <div style={styles.ratioCard}>
            <span style={styles.ratioLabel}>Yield curve (10Y − 2Y)</span>
            <span style={styles.ratioValue}>{macro.yieldCurveSpreadPct >= 0 ? '+' : ''}{macro.yieldCurveSpreadPct}%</span>
            <span style={styles.ratioHint}>Negative = inverted; recession signal.</span>
          </div>
          <div style={styles.ratioCard}>
            <span style={styles.ratioLabel}>Real 10Y yield</span>
            <span style={styles.ratioValue}>{macro.realTenYearYieldPct >= 0 ? '+' : ''}{macro.realTenYearYieldPct}%</span>
            <span style={styles.ratioHint}>10Y Treasury − CPI. Real return on bonds.</span>
          </div>
          <div style={styles.ratioCard}>
            <span style={styles.ratioLabel}>Equity risk premium</span>
            <span style={styles.ratioValue}>{macro.equityRiskPremiumEstimatePct}%</span>
            <span style={styles.ratioHint}>Expected excess return of stocks over risk-free.</span>
          </div>
        </div>
      </Section>

      {/* ——— Section 2: How personal dynamics impact Colt Road's perspective ——— */}
      <Section title="How Your Personal Dynamics Might Impact Colt Road's Perspective">
        <p style={styles.sectionDesc}>
          The base split above reflects today’s macro. Your answers below amend Colt Road’s recommendation to fit your time horizon, risk tolerance, and preferences.
        </p>

        <h3 style={styles.subsectionTitle}>Inputs that amend the target mix</h3>
        <div style={styles.formGridTwoCol} className="form-grid">
          <FormGroup label="Time horizon (years until you need this money)" reserveLabelSpace>
            <input
              type="number"
              value={pf.timeHorizonYears === 0 ? '' : pf.timeHorizonYears}
              onChange={(e) => updatePersonal('timeHorizonYears', parseInt(e.target.value, 10) || 0)}
              style={styles.input}
              min="1"
              max="50"
              placeholder="e.g. 10"
            />
          </FormGroup>
          <FormGroup label="Your age" reserveLabelSpace>
            <input
              type="number"
              value={pf.age === 0 ? '' : pf.age}
              onChange={(e) => updatePersonal('age', parseInt(e.target.value, 10) || 0)}
              style={styles.input}
              min="18"
              max="100"
              placeholder="e.g. 45"
            />
          </FormGroup>
          <FormGroup label="Risk appetite" reserveLabelSpace>
            <select
              value={pf.riskAppetite}
              onChange={(e) => updatePersonal('riskAppetite', e.target.value as PersonalFactors['riskAppetite'])}
              style={styles.input}
            >
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </FormGroup>
          <FormGroup label="Largest drop in a bad year you could tolerate (%)" reserveLabelSpace>
            <select
              value={pf.maxAcceptableLossPct}
              onChange={(e) => updatePersonal('maxAcceptableLossPct', parseInt(e.target.value, 10))}
              style={styles.input}
            >
              <option value={5}>5%</option>
              <option value={10}>10%</option>
              <option value={15}>15%</option>
              <option value={20}>20%</option>
              <option value={25}>25%</option>
              <option value={30}>30%+</option>
            </select>
          </FormGroup>
          <FormGroup label="If your portfolio dropped 20% in a year, you would..." reserveLabelSpace>
            <select
              value={pf.ifPortfolioDropped20}
              onChange={(e) => updatePersonal('ifPortfolioDropped20', e.target.value as PersonalFactors['ifPortfolioDropped20'])}
              style={styles.input}
            >
              <option value="sell">Sell</option>
              <option value="reduce">Reduce exposure</option>
              <option value="hold">Hold</option>
              <option value="add">Add more</option>
            </select>
          </FormGroup>
          <FormGroup label="How important is avoiding short-term losses?" reserveLabelSpace>
            <select
              value={pf.avoidShortTermLosses}
              onChange={(e) => updatePersonal('avoidShortTermLosses', e.target.value as PersonalFactors['avoidShortTermLosses'])}
              style={styles.input}
            >
              <option value="very">Very</option>
              <option value="somewhat">Somewhat</option>
              <option value="notVery">Not very</option>
            </select>
          </FormGroup>
        </div>

        <h3 style={styles.subsectionTitle}>Share of your wealth in this portfolio</h3>
        <p style={styles.ratiosHint}>The higher the share of your total assets in this liquid portfolio, the more conservative we suggest being (more bonds, less stocks).</p>
        <div style={styles.formGridTwoCol} className="form-grid">
          <FormGroup label="What % of your total assets is in this liquid portfolio?" reserveLabelSpace>
            <select
              value={pf.pctOfAssetsInLiquidPortfolio}
              onChange={(e) => updatePersonal('pctOfAssetsInLiquidPortfolio', parseInt(e.target.value, 10) as PersonalFactors['pctOfAssetsInLiquidPortfolio'])}
              style={styles.input}
            >
              <option value={25}>Less than 25%</option>
              <option value={50}>25–50%</option>
              <option value={75}>50–75%</option>
              <option value={100}>75% or more</option>
            </select>
          </FormGroup>
          <FormGroup label="Amount in this portfolio ($) — for simulation only" reserveLabelSpace>
            <input
              type="text"
              value={formatNumber(config.portfolioValue)}
              onChange={(e) => setPortfolioValue(parseFloat(String(e.target.value).replace(/,/g, '')) || 0)}
              style={styles.input}
              placeholder="e.g. 100000"
            />
          </FormGroup>
        </div>

        <div style={styles.allocationDisplay}>
          <h3 style={styles.allocationTitle}>Your suggested mix (Colt Road baseline amended by your answers)</h3>
          <p style={styles.allocationSubtext}>Change any answer above to see how it amends Colt Road's base recommendation.</p>
          <div style={styles.allocationBarContainer}>
            <div style={{ ...styles.allocationSegment, backgroundColor: '#2d4a2b', width: `${suggestedEquityPct}%` }}>
              <span style={styles.allocationLabel}>{suggestedEquityPct}% Stocks</span>
            </div>
            <div style={{ ...styles.allocationSegment, backgroundColor: '#1a2f4a', width: `${100 - suggestedEquityPct}%` }}>
              <span style={styles.allocationLabel}>{100 - suggestedEquityPct}% Bonds</span>
            </div>
          </div>
          <h4 style={styles.calculationTitle}>How your amended mix was calculated</h4>
          <ul style={styles.calculationList}>
            {calculationSteps.map((step, i) => (
              <li key={i} style={styles.calculationStep}>{step}</li>
            ))}
          </ul>
        </div>

        <ButtonGroup onBack={onBack} onNext={onNext} nextLabel="Continue to Stock Selection" />
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
    lineHeight: 1.6
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
  infoBox: {
    background: '#f5f2e9',
    border: '2px solid #d9d2c1',
    padding: '1.25rem',
    marginBottom: '1.5rem',
    fontSize: '0.95rem',
    color: '#2c2c2c',
    lineHeight: 1.5
  },
  hint: {
    fontSize: '0.95rem',
    color: '#6d6658',
    marginBottom: '1rem',
    lineHeight: 1.5
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2.5rem',
    marginBottom: '2rem'
  },
  formGridTwoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem 2.5rem',
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
  allocationDisplay: {
    background: '#f5f2e9',
    border: '1px solid rgba(168, 155, 132, 0.4)',
    padding: '2rem',
    marginTop: '3rem',
    marginBottom: '2rem'
  },
  allocationTitle: {
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '1.8rem',
    color: '#0f1f35',
    marginBottom: '0.5rem',
    textAlign: 'center'
  },
  allocationSubtext: {
    fontSize: '0.95rem',
    color: '#6d6658',
    textAlign: 'center',
    marginBottom: '1.5rem',
    lineHeight: 1.5
  },
  allocationBarContainer: {
    display: 'flex',
    height: '60px',
    border: '1px solid rgba(168, 155, 132, 0.4)',
    overflow: 'hidden',
    marginBottom: '1.5rem'
  },
  allocationSegment: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'width 0.3s ease'
  },
  allocationLabel: {
    color: 'white',
    fontWeight: 700,
    fontSize: '1.1rem',
    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
  },
  allocationExplain: {
    fontSize: '1rem',
    color: '#2c2c2c',
    textAlign: 'center',
    lineHeight: 1.6
  },
  calculationTitle: {
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '1.1rem',
    color: '#0f1f35',
    marginTop: '1.5rem',
    marginBottom: '0.75rem',
    fontWeight: 600
  },
  calculationList: {
    margin: 0,
    paddingLeft: '1.25rem',
    fontSize: '0.95rem',
    color: '#2c2c2c',
    lineHeight: 1.7
  },
  calculationStep: {
    marginBottom: '0.35rem'
  },
  macroAsOf: {
    fontSize: '0.9rem',
    color: '#6d6658',
    marginBottom: '1rem',
    fontStyle: 'italic'
  },
  macroStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem'
  },
  macroStatCard: {
    background: 'white',
    border: '2px solid #d9d2c1',
    padding: '1rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem'
  },
  macroStatLabel: {
    fontSize: '0.8rem',
    color: '#6d6658',
    textTransform: 'uppercase',
    letterSpacing: '0.03em'
  },
  macroStatValue: {
    fontSize: '1.35rem',
    fontWeight: 700,
    color: '#0f1f35'
  },
  macroStatHint: {
    fontSize: '0.8rem',
    color: '#6d6658'
  },
  /** Same font as recommendation rationale (aiBaselineRationale) */
  updateAndMetricsBlurb: {
    margin: '0 0 1.5rem 0',
    fontSize: '0.95rem',
    color: '#2c2c2c',
    lineHeight: 1.65
  },
  ratiosHint: {
    fontSize: '0.95rem',
    color: '#6d6658',
    marginBottom: '1rem',
    lineHeight: 1.5
  },
  ratiosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '1.25rem',
    marginBottom: '2rem'
  },
  ratioCard: {
    background: 'white',
    border: '2px solid #d9d2c1',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem'
  },
  ratioLabel: {
    fontSize: '0.8rem',
    color: '#6d6658',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    fontWeight: 600
  },
  ratioValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#0f1f35'
  },
  ratioHint: {
    fontSize: '0.82rem',
    color: '#6d6658',
    lineHeight: 1.4
  },
  erpChartWrapper: {
    height: '460px',
    marginBottom: '2rem',
    padding: '1.25rem',
    background: '#f5f2e9'
  },
  aiBaselineBlock: {
    background: 'linear-gradient(135deg, #f0ede5 0%, #e8e4db 100%)',
    border: '2px solid #d9d2c1',
    padding: '1.5rem 2rem',
    marginBottom: '0.5rem',
    borderLeft: '4px solid #1a2f4a'
  },
  aiBaselineBar: {
    display: 'flex',
    height: '52px',
    border: '1px solid rgba(168, 155, 132, 0.5)',
    overflow: 'hidden',
    marginBottom: '1.25rem'
  },
  aiBaselineSegment: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d4a2b',
    transition: 'width 0.3s ease'
  },
  aiBaselineLabel: {
    color: 'white',
    fontWeight: 700,
    fontSize: '1rem',
    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
  },
  aiBaselineRationale: {
    margin: 0,
    fontSize: '0.95rem',
    color: '#2c2c2c',
    lineHeight: 1.65
  }
};

