/** Colt Road horse icon next to "Colt Road Management". Cache-bust so updates to the image are visible. */
const COLT_ICON = '/colt-icon.png?v=2';

export default function ColtHeader() {
  return (
    <header style={styles.header} className="colt-header">
      <div style={styles.headerContent} className="colt-header-content">
        <div style={styles.coltContainer}>
          <img src={COLT_ICON} alt="Colt Road" style={styles.coltImage} />
        </div>
        <div style={styles.brandBlock}>
          <h1 style={styles.brandName} className="colt-brand-name">Colt Road Management</h1>
          <p style={styles.brandSubtitle}>Nimble AI Agent to Test Your Investment Ideas</p>
        </div>
      </div>
    </header>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    background: 'linear-gradient(180deg, #0f1f35 0%, #0d1929 100%)',
    padding: '0.5rem 4rem',
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
    gap: '0.35rem'
  },
  coltContainer: {
    width: '82px',
    height: '82px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent'
  },
  coltImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    width: 'auto',
    height: 'auto',
    minWidth: 0,
    minHeight: 0,
    objectFit: 'contain',
    objectPosition: 'center',
    display: 'block',
    margin: '0 auto',
    filter: 'invert(1)',
    mixBlendMode: 'lighten' as const
  },
  brandBlock: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '0.35rem'
  },
  brandName: {
    fontFamily: "var(--font-serif), Georgia, 'Times New Roman', serif",
    fontSize: '1.875rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
    color: '#f8f6f1',
    margin: 0,
    lineHeight: 1.2
  },
  brandSubtitle: {
    fontFamily: "var(--font-serif), Georgia, 'Times New Roman', serif",
    fontSize: '0.75rem',
    color: 'rgba(201, 184, 150, 0.95)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    margin: 0,
    fontWeight: 500,
    lineHeight: 1.4
  }
};

