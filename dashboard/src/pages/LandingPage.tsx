interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div style={styles.landingContainer}>
      <div style={styles.landingHero}>
        <h2 style={styles.landingTitle}>Test Your Investment Strategy</h2>
        <p style={styles.landingText}>
          Backtest portfolio strategies using historical market data. Compare different allocations and stock selections 
          to understand how they would have performed in real market conditions.
        </p>
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
  landingText: {
    fontSize: '1.3rem',
    color: '#6d6658',
    marginBottom: '2rem',
    lineHeight: 1.6
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

