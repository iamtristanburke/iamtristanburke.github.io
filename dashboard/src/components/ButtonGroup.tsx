interface ButtonGroupProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
}

export default function ButtonGroup({ onBack, onNext, nextLabel = "Continue" }: ButtonGroupProps) {
  return (
    <div style={styles.buttonGroup} className="button-group">
      {onBack && <button style={styles.btnSecondary} onClick={onBack}>Back</button>}
      <button style={styles.btnPrimary} onClick={onNext}>{nextLabel}</button>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  buttonGroup: {
    display: 'flex',
    gap: '1.5rem',
    justifyContent: 'center',
    marginTop: '3rem'
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #2d4a2b 0%, #3d5a3c 100%)',
    color: '#f5f2e9',
    border: '3px solid #1f3622',
    padding: '1.25rem 4rem',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight: 700,
    fontSize: '1.1rem',
    cursor: 'pointer',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    boxShadow: '0 6px 20px rgba(45, 74, 43, 0.3)',
    transition: 'all 0.3s ease',
    borderRadius: 0
  },
  btnSecondary: {
    background: 'white',
    color: '#2d4a2b',
    border: '2px solid #2d4a2b',
    padding: '0.85rem 1.75rem',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    borderRadius: 0
  }
};

