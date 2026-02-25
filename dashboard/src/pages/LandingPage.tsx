const COLT_ICON = '/colt-icon.png?v=2';

interface LandingPageProps {
  onStart: () => void;
  onResearch: () => void;
}

export default function LandingPage({ onStart, onResearch }: LandingPageProps) {
  return (
    <div style={styles.landingContainer} className="landing-container">
      <style>{`
        .landing-btn {
          transform: translateY(0);
        }
        .landing-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.15);
          box-shadow: 0 8px 28px rgba(0,0,0,0.3) !important;
        }
        .landing-btn:active {
          transform: translateY(0);
          filter: brightness(0.95);
        }
      `}</style>
      <div style={styles.landingHero} className="landing-hero">
        <h2 style={styles.landingTitle} className="landing-title">Colt Road Personal Investment Concierge</h2>
        <div style={styles.buttonRow}>
          <button className="landing-btn" style={styles.btnResearch} onClick={onResearch}>
            <img src={COLT_ICON} alt="" style={styles.btnIcon} aria-hidden />
            Colt Road Research
          </button>
          <button className="landing-btn" style={styles.btnPrimary} onClick={onStart}>
            Customize Your Portfolio and Trading Strategy
          </button>
        </div>
        <p style={styles.disclaimer}>
          <strong>Disclaimer:</strong> This tool is for educational and research purposes only. It is not investment advice, 
          financial advice, or a recommendation to buy or sell any securities. Past performance does not guarantee future results. 
          Consult with a qualified financial advisor before making investment decisions.
        </p>
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
    padding: '2.5rem 4rem 2rem',
    textAlign: 'center',
    boxShadow: '0 4px 16px rgba(44, 44, 44, 0.08)',
    position: 'relative'
  },
  landingTitle: {
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '2.25rem',
    fontWeight: 600,
    color: '#0f1f35',
    marginTop: 0,
    marginBottom: '0.75rem',
    lineHeight: 1.3
  },
  missionStatement: {
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '1.25rem',
    color: '#0f1f35',
    marginBottom: '1.75rem',
    lineHeight: 1.5
  },
  disclaimer: {
    fontSize: '0.85rem',
    color: '#8b7044',
    background: 'rgba(169, 138, 79, 0.1)',
    border: '2px solid #a98a4f',
    padding: '0.75rem 1rem',
    marginTop: '2rem',
    marginBottom: 0,
    lineHeight: 1.45,
    textAlign: 'left'
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: '1.5rem',
    flexWrap: 'wrap'
  },
  btnResearch: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
    width: '340px',
    background: 'linear-gradient(135deg, #0f1f35 0%, #1a3050 100%)',
    color: '#e8eef4',
    border: '2px solid #0a1525',
    padding: '0.7rem 1.5rem',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight: 700,
    fontSize: '1.05rem',
    cursor: 'pointer',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    boxShadow: '0 4px 14px rgba(15, 31, 53, 0.3)',
    transition: 'all 0.2s ease',
    borderRadius: 0,
    boxSizing: 'border-box'
  },
  btnIcon: {
    width: '22px',
    height: '22px',
    objectFit: 'contain',
    filter: 'invert(1)',
    mixBlendMode: 'lighten'
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '340px',
    background: 'linear-gradient(135deg, #2d4a2b 0%, #3d5a3c 100%)',
    color: '#f5f2e9',
    border: '2px solid #1f3622',
    padding: '0.7rem 1.5rem',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight: 700,
    fontSize: '1.05rem',
    cursor: 'pointer',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    boxShadow: '0 4px 14px rgba(45, 74, 43, 0.3)',
    transition: 'all 0.2s ease',
    borderRadius: 0,
    boxSizing: 'border-box',
    textAlign: 'center'
  }
};
