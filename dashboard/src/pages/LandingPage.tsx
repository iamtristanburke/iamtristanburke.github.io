interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div style={styles.landingContainer} className="landing-container">
      <div style={styles.landingHero} className="landing-hero">
        <h2 style={styles.landingTitle} className="landing-title">Colt Road Personal Investment Concierge</h2>
        <p style={styles.missionStatement} className="landing-mission">
          Colt Road helps you allocate the capital you&apos;ve set aside for personal investments.
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
    border: '1px solid rgba(168, 155, 132, 0.4)',
    padding: '6rem 4rem',
    textAlign: 'center',
    boxShadow: '0 4px 16px rgba(44, 44, 44, 0.08)',
    position: 'relative'
  },
  landingTitle: {
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '2.25rem',
    fontWeight: 600,
    color: '#0f1f35',
    marginBottom: '1.25rem',
    lineHeight: 1.3
  },
  missionStatement: {
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '1.25rem',
    color: '#0f1f35',
    marginBottom: '2rem',
    lineHeight: 1.5
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
    border: '2px solid #1f3622',
    padding: '1rem 3rem',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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

