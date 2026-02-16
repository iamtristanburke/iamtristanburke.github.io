import { useMemo, useEffect, useState } from 'react';
import { Config, PersonalFactors, MarketMacroSnapshot } from '../types/colt-road';
import ProgressBar from '../components/ProgressBar';
import Section from '../components/Section';
import FormGroup from '../components/FormGroup';
import ButtonGroup from '../components/ButtonGroup';
import { formatNumber } from '../utils/formatters';
import { getDefaultMacroSnapshot, fetchMacroSnapshot } from '../services/macroApi';

const COLT_ICON = '/colt-icon.png?v=2';

function getTodayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

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
  onOpenResearch?: () => void;
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

export default function ProfilePage({ config, updateConfig, onNext, onBack, onStepClick, onOpenResearch }: ProfilePageProps) {
  const pf = config.personalFactors ?? defaultPersonal;
  const [macro, setMacro] = useState<MarketMacroSnapshot>(() => getDefaultMacroSnapshot(getTodayISO()));

  useEffect(() => {
    let lastDate = getTodayISO();
    const load = () => fetchMacroSnapshot(lastDate).then(setMacro);
    load();
    const id = setInterval(() => {
      const today = getTodayISO();
      if (today !== lastDate) {
        lastDate = today;
        fetchMacroSnapshot(today).then(setMacro);
      }
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const suggestedEquityPct = useMemo(
    () => deriveSuggestedAllocation(pf, macro.aiBaselineEquityPct).pct,
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

  return (
    <div style={styles.container} className="page-container">
      <ProgressBar current={2} onStepClick={onStepClick} />

      {/* ——— Section 1: Asset allocation ——— */}
      <Section title="1. What should your asset allocation be?">
        <div style={styles.perspectiveHeadingRow}>
          <div style={styles.coltIconWrap}>
            <img src={COLT_ICON} alt="" style={styles.coltIconWhite} aria-hidden />
          </div>
          <h3 style={styles.subsectionTitleInRow}>Colt Road&apos;s Perspective</h3>
        </div>
        <div style={styles.aiBaselineBlock}>
          <div style={styles.aiBaselineBar}>
            <div style={{ ...styles.aiBaselineSegment, width: `${macro.aiBaselineEquityPct}%` }}>
              <span style={styles.aiBaselineLabel}>{macro.aiBaselineEquityPct}% Equities</span>
            </div>
            <div style={{ ...styles.aiBaselineSegment, width: `${100 - macro.aiBaselineEquityPct}%`, backgroundColor: '#1a2f4a' }}>
              <span style={styles.aiBaselineLabel}>{100 - macro.aiBaselineEquityPct}% Debt</span>
            </div>
          </div>
          <p style={styles.aiBaselineRationale}>{macro.aiBaselineRationale}</p>
        </div>

        {onOpenResearch && (
          <button type="button" onClick={onOpenResearch} style={styles.researchBtn}>
            Colt Road&apos;s Research on Asset Allocation
          </button>
        )}

      </Section>

      {/* ——— Section 2: How personal dynamics impact Colt Road's perspective ——— */}
      <Section title={<>Custom Colt Road&apos;s Recommendation to <span style={{ textDecoration: 'underline' }}>Your Needs</span></>}>
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
              <span style={styles.allocationLabel}>{suggestedEquityPct}% Equities</span>
            </div>
            <div style={{ ...styles.allocationSegment, backgroundColor: '#1a2f4a', width: `${100 - suggestedEquityPct}%` }}>
              <span style={styles.allocationLabel}>{100 - suggestedEquityPct}% Debt</span>
            </div>
          </div>
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
  perspectiveHeadingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    marginTop: 0,
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
  subsectionTitleInRow: {
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '1.35rem',
    color: '#0f1f35',
    margin: 0,
    paddingBottom: 0
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
  },
  researchBtn: {
    display: 'block',
    width: '100%',
    marginTop: '1rem',
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
  researchOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 31, 53, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    padding: '2rem'
  },
  researchModal: {
    background: '#f8f6f0',
    border: '2px solid #d9d2c1',
    borderRadius: '8px',
    maxWidth: '720px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
  },
  researchModalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.25rem',
    borderBottom: '2px solid #d9d2c1',
    background: '#f0ede5',
    flexShrink: 0
  },
  researchModalTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f1f35',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  researchCloseBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#6d6658',
    cursor: 'pointer',
    padding: '0.25rem'
  },
  researchModalBody: {
    overflowY: 'auto',
    padding: '1.25rem',
    flex: '1 1 auto',
    minHeight: 0
  },
  reportSectionTitle: {
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#0f1f35',
    marginTop: '1.5rem',
    marginBottom: '0.5rem',
    paddingBottom: '0.35rem',
    borderBottom: '1px solid #d9d2c1'
  },
  reportParagraph: {
    fontSize: '0.9rem',
    color: '#2c2c2c',
    lineHeight: 1.6,
    margin: '0 0 0.75rem 0'
  },
  reportLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#0f1f35',
    margin: '0.5rem 0 0.25rem 0'
  },
  reportEquation: {
    fontFamily: "var(--font-serif), Georgia, 'Times New Roman', serif",
    fontSize: '0.95rem',
    color: '#0f1f35',
    margin: '0.25rem 0 0.75rem 0',
    padding: '0.5rem 0.75rem',
    background: '#f0ede5',
    borderLeft: '3px solid #0f1f35'
  },
  researchChartWrapper: {
    height: '220px',
    margin: '1rem 0'
  },
  reportEquationNote: {
    fontSize: '0.85rem',
    color: '#6d6658',
    fontStyle: 'italic'
  },
  reportList: {
    margin: '0.5rem 0 1rem 0',
    paddingLeft: '1.25rem',
    fontSize: '0.9rem',
    color: '#2c2c2c',
    lineHeight: 1.6
  },
  reportTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
    marginBottom: '1rem'
  },
  reportTableTh: {
    textAlign: 'left',
    padding: '0.5rem 0.75rem',
    borderBottom: '2px solid #0f1f35',
    color: '#0f1f35',
    fontWeight: 600
  },
  reportTableTd: {
    padding: '0.5rem 0.75rem',
    borderBottom: '1px solid #d9d2c1',
    color: '#2c2c2c',
    verticalAlign: 'top'
  }
};

