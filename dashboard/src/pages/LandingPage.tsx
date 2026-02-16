interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div style={styles.landingContainer} className="landing-container">
      <div style={styles.landingHero} className="landing-hero">
        <h2 style={styles.landingTitle} className="landing-title">AI-Powered Personal Investment Allocation</h2>
        <p style={styles.missionStatement} className="landing-mission">
          We are designing an AI assistant to help allocate the capital you&apos;ve set aside for personal investments.
        </p>
        <p style={styles.landingText} className="landing-text">
          The assistant is built around three questions that shape your portfolio:
        </p>
        <ol style={styles.questionList}>
          <li><strong>What&apos;s your debt/equity allocation?</strong> — AI uses market factors (real bond yields, equity valuations, Buffett ratio) and your personal situation (time horizon, age, return needs, risk appetite) to suggest and rebalance your mix over time.</li>
          <li><strong>What stocks should you be buying?</strong> — Your investment style (growth vs. income), themes and industries, and the signals you care about (technical, fundamental, or AI-based) define your stock universe and buy criteria.</li>
          <li><strong>How much to balance within the portfolio?</strong> — What prompts buys and sells in your universe: traditional technical analysis, AI-based signals, or other rules.</li>
        </ol>
        <p style={styles.disclaimer}>
          <strong>Disclaimer:</strong> This tool is for educational and research purposes only. It is not investment advice, 
          financial advice, or a recommendation to buy or sell any securities. Past performance does not guarantee future results. 
          Consult with a qualified financial advisor before making investment decisions.
        </p>
        <button style={styles.btnPrimary} onClick={onStart}>Get Started</button>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  landingContainer: {
    maxWidth: '1400px',
    margin: '4rem auto',
    padding: '0 4rem'
  },
  landingHero: {
    background: '#fbf9f4',
    border: '3px solid #a89b84',
    padding: '6rem 4rem',
    textAlign: 'center',
    boxShadow: '0 6px 20px rgba(44, 44, 44, 0.12)',
    position: 'relative',
    borderLeft: '10px solid transparent',
    borderImage: 'linear-gradient(to bottom, #6b2737, #a98a4f, #2d4a2b, #9d5b3f, #1a2f4a) 1'
  },
  landingTitle: {
    fontFamily: "'Libre Baskerville', serif",
    fontSize: '3.5rem',
    color: '#0f1f35',
    marginBottom: '1.5rem',
    lineHeight: 1.2
  },
  missionStatement: {
    fontSize: '1.35rem',
    color: '#0f1f35',
    marginBottom: '1.5rem',
    lineHeight: 1.6,
    fontStyle: 'italic'
  },
  landingText: {
    fontSize: '1.2rem',
    color: '#6d6658',
    marginBottom: '1rem',
    lineHeight: 1.6
  },
  questionList: {
    fontSize: '1.05rem',
    color: '#2c2c2c',
    marginBottom: '2rem',
    paddingLeft: '1.5rem',
    lineHeight: 1.7,
    textAlign: 'left'
  },
  disclaimer: {
    fontSize: '0.9rem',
    color: '#8b7044',
    background: 'rgba(169, 138, 79, 0.1)',
    border: '2px solid #a98a4f',
    padding: '1.5rem',
    marginBottom: '2rem',
    lineHeight: 1.5,
    textAlign: 'left'
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
  }
};

