const COLT_ICON = '/colt-icon.png';

export default function ColtHeader() {
  return (
    <header style={styles.header} className="colt-header">
      <div style={styles.headerContent} className="colt-header-content">
        <div style={styles.coltContainer}>
          <img src={COLT_ICON} alt="Colt Road" style={styles.coltImage} />
        </div>
        <div style={styles.brandBlock}>
          <h1 style={styles.brandName} className="colt-brand-name">Colt Road Manager</h1>
          <p style={styles.brandSubtitle}>Nimble AI Engine to Test Your Ideas</p>
        </div>
      </div>
    </header>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    background: 'linear-gradient(180deg, #0f1f35 0%, #0d1929 100%)',
    padding: '1.5rem 4rem',
    borderBottom: '1px solid rgba(169, 138, 79, 0.35)',
    boxShadow: '0 1px 0 0 rgba(255, 255, 255, 0.04)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '1.75rem'
  },
  coltContainer: {
    width: '72px',
    height: '72px',
    borderRadius: '12px',
    overflow: 'hidden',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(169, 138, 79, 0.2)'
  },
  coltImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
    filter: 'invert(1)'
  },
  brandBlock: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '0.35rem'
  },
  brandName: {
    fontFamily: "'Libre Baskerville', Georgia, serif",
    fontSize: '1.875rem',
    fontWeight: 600,
    letterSpacing: '-0.02em',
    color: '#f8f6f1',
    margin: 0,
    lineHeight: 1.2
  },
  brandSubtitle: {
    fontSize: '0.8125rem',
    color: 'rgba(201, 184, 150, 0.9)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    margin: 0,
    fontWeight: 500,
    lineHeight: 1.4
  }
};

