import { Config } from '../types/colt-road';
import ProgressBar from '../components/ProgressBar';
import Section from '../components/Section';
import FormGroup from '../components/FormGroup';
import ButtonGroup from '../components/ButtonGroup';
import { formatNumber } from '../utils/formatters';

interface ProfilePageProps {
  config: Config;
  updateConfig: (key: keyof Config, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ProfilePage({ config, updateConfig, onNext, onBack }: ProfilePageProps) {
  return (
    <div style={styles.container} className="page-container">
      <ProgressBar current={2} />
      <Section title="Portfolio Configuration">
        <div style={styles.formGrid} className="form-grid">
          <FormGroup label="Initial Portfolio Value ($)">
            <input 
              type="text" 
              value={formatNumber(config.portfolioValue)} 
              onChange={(e) => updateConfig('portfolioValue', parseFloat(e.target.value.replace(/,/g, '')))} 
              style={styles.input} 
            />
          </FormGroup>
          
          <FormGroup label="Target Equity Allocation (%)">
            <input 
              type="number" 
              value={config.targetEquityPct} 
              onChange={(e) => updateConfig('targetEquityPct', parseInt(e.target.value))} 
              style={styles.input} 
              min="0" 
              max="100" 
            />
          </FormGroup>
        </div>
        
        <div style={styles.allocationDisplay}>
          <h3 style={styles.allocationTitle}>Your Portfolio Allocation</h3>
          <div style={styles.allocationBarContainer}>
            <div style={{...styles.allocationSegment, backgroundColor: '#2d4a2b', width: `${config.targetEquityPct}%`}}>
              <span style={styles.allocationLabel}>{config.targetEquityPct}% Stocks</span>
            </div>
            <div style={{...styles.allocationSegment, backgroundColor: '#1a2f4a', width: `${100 - config.targetEquityPct}%`}}>
              <span style={styles.allocationLabel}>{100 - config.targetEquityPct}% Bonds</span>
            </div>
          </div>
          <p style={styles.allocationExplain}>
            <strong>Your portfolio will be {config.targetEquityPct}% stocks / {100 - config.targetEquityPct}% bonds</strong> throughout the backtest. 
            This allocation directly impacts your returns and risk.
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
    marginBottom: '1.5rem',
    textAlign: 'center'
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

