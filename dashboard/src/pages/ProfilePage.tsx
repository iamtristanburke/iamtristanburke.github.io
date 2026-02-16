import { useMemo, useEffect } from 'react';
import { Config, PersonalFactors } from '../types/colt-road';
import ProgressBar from '../components/ProgressBar';
import Section from '../components/Section';
import FormGroup from '../components/FormGroup';
import ButtonGroup from '../components/ButtonGroup';
import { formatNumber } from '../utils/formatters';

/** Derive suggested equity % from personal factors (AI would do this; we use a simple heuristic for the app). */
function deriveSuggestedEquityPct(pf: PersonalFactors): number {
  let pct = pf.riskAppetite === 'conservative' ? 35 : pf.riskAppetite === 'moderate' ? 60 : 80;
  if (pf.maxAcceptableLossPct <= 10) pct -= 10;
  else if (pf.maxAcceptableLossPct >= 25) pct += 5;
  if (pf.ifPortfolioDropped20 === 'sell') pct -= 25;
  else if (pf.ifPortfolioDropped20 === 'reduce') pct -= 10;
  else if (pf.ifPortfolioDropped20 === 'add') pct += 5;
  if (pf.avoidShortTermLosses === 'very') pct -= 15;
  else if (pf.avoidShortTermLosses === 'notVery') pct += 5;
  if (pf.timeHorizonYears >= 15) pct += 5;
  if (pf.timeHorizonYears >= 25) pct += 5;
  if (pf.age < 40) pct += 5;
  if (pf.age > 60) pct -= 5;
  return Math.max(10, Math.min(95, Math.round(pct)));
}

interface ProfilePageProps {
  config: Config;
  updateConfig: (key: keyof Config, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const defaultPersonal: PersonalFactors = {
  timeHorizonYears: 10,
  age: 45,
  riskAppetite: 'moderate',
  maxAcceptableLossPct: 15,
  ifPortfolioDropped20: 'hold',
  avoidShortTermLosses: 'somewhat'
};

export default function ProfilePage({ config, updateConfig, onNext, onBack }: ProfilePageProps) {
  const pf = config.personalFactors ?? defaultPersonal;
  const suggestedEquityPct = useMemo(() => deriveSuggestedEquityPct(pf), [pf]);

  useEffect(() => {
    updateConfig('targetEquityPct', suggestedEquityPct);
  }, []);

  const updatePersonal = (key: keyof PersonalFactors, value: any) => {
    const next = { ...pf, [key]: value };
    updateConfig('personalFactors', next);
    updateConfig('targetEquityPct', deriveSuggestedEquityPct(next));
  };

  const setPortfolioValue = (value: number) => {
    updateConfig('portfolioValue', value);
  };

  return (
    <div style={styles.container} className="page-container">
      <ProgressBar current={2} />
      <Section title="1. What's your debt/equity allocation?">
        <p style={styles.sectionDesc}>
          We need information about you and your risk tolerance so the AI can <strong>recommend</strong> the right debt/equity mix. It will use market factors (real bond yields, equity valuations, Buffett ratio) and your answers below to suggest and rebalance your allocation over time.
        </p>

        <h3 style={styles.subsectionTitle}>Market factors (AI-driven)</h3>
        <p style={styles.infoBox}>
          The assistant considers real bond yields, equity valuations, and Buffett ratio when recommending allocation. These are incorporated into the model and will drive rebalancing as markets change.
        </p>

        <h3 style={styles.subsectionTitle}>When do you need your money?</h3>
        <div style={styles.formGrid} className="form-grid">
          <FormGroup label="Time horizon (years until you need this money)">
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
          <FormGroup label="Your age">
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
        </div>

        <h3 style={styles.subsectionTitle}>Risk appetite</h3>
        <p style={styles.hint}>These help the AI size your equity allocation. More tolerance for volatility typically means a higher suggested equity share.</p>
        <div style={styles.formGrid} className="form-grid">
          <FormGroup label="Overall risk appetite">
            <select
              value={pf.riskAppetite}
              onChange={(e) => updatePersonal('riskAppetite', e.target.value as PersonalFactors['riskAppetite'])}
              style={styles.input}
            >
              <option value="conservative">Conservative — prefer stability over growth</option>
              <option value="moderate">Moderate — balance growth and stability</option>
              <option value="aggressive">Aggressive — willing to take more risk for higher return</option>
            </select>
          </FormGroup>
          <FormGroup label="Largest drop in a bad year you could tolerate (%)">
            <select
              value={pf.maxAcceptableLossPct}
              onChange={(e) => updatePersonal('maxAcceptableLossPct', parseInt(e.target.value, 10))}
              style={styles.input}
            >
              <option value={5}>5% — I can't stomach much loss</option>
              <option value={10}>10%</option>
              <option value={15}>15%</option>
              <option value={20}>20%</option>
              <option value={25}>25%</option>
              <option value={30}>30% or more</option>
            </select>
          </FormGroup>
          <FormGroup label="If your portfolio dropped 20% in a year, you would...">
            <select
              value={pf.ifPortfolioDropped20}
              onChange={(e) => updatePersonal('ifPortfolioDropped20', e.target.value as PersonalFactors['ifPortfolioDropped20'])}
              style={styles.input}
            >
              <option value="sell">Sell — I'd want out</option>
              <option value="reduce">Reduce — trim my equity exposure</option>
              <option value="hold">Hold — stay the course</option>
              <option value="add">Add — invest more (buy the dip)</option>
            </select>
          </FormGroup>
          <FormGroup label="How important is avoiding short-term losses?">
            <select
              value={pf.avoidShortTermLosses}
              onChange={(e) => updatePersonal('avoidShortTermLosses', e.target.value as PersonalFactors['avoidShortTermLosses'])}
              style={styles.input}
            >
              <option value="very">Very — I need to avoid big drawdowns</option>
              <option value="somewhat">Somewhat — I can accept some volatility</option>
              <option value="notVery">Not very — I'm focused on long-term growth</option>
            </select>
          </FormGroup>
        </div>

        <h3 style={styles.subsectionTitle}>Portfolio size</h3>
        <div style={styles.formGrid} className="form-grid">
          <FormGroup label="Amount to allocate ($)">
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
          <h3 style={styles.allocationTitle}>Suggested allocation (from your inputs)</h3>
          <p style={styles.allocationSubtext}>The AI suggests this mix based on your time horizon, age, and risk appetite. It will rebalance over time as market factors change.</p>
          <div style={styles.allocationBarContainer}>
            <div style={{ ...styles.allocationSegment, backgroundColor: '#2d4a2b', width: `${suggestedEquityPct}%` }}>
              <span style={styles.allocationLabel}>{suggestedEquityPct}% Equity</span>
            </div>
            <div style={{ ...styles.allocationSegment, backgroundColor: '#1a2f4a', width: `${100 - suggestedEquityPct}%` }}>
              <span style={styles.allocationLabel}>{100 - suggestedEquityPct}% Debt</span>
            </div>
          </div>
          <p style={styles.allocationExplain}>
            This suggestion will be used for the backtest. In a full product, the AI would refine it using live market data (real bond yields, equity valuations, Buffett ratio).
          </p>
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
    fontFamily: "'Libre Baskerville', serif",
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
  input: {
    width: '100%',
    background: 'white',
    border: '2px solid #d9d2c1',
    padding: '0.85rem 1rem',
    color: '#2c2c2c',
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '0.95rem',
    borderRadius: 0
  },
  allocationDisplay: {
    background: '#f5f2e9',
    border: '3px solid #a98a4f',
    padding: '2rem',
    marginTop: '3rem',
    marginBottom: '2rem'
  },
  allocationTitle: {
    fontFamily: "'Libre Baskerville', serif",
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
    border: '3px solid #a89b84',
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
  }
};

