interface ProgressBarProps {
  current: number;
  steps?: string[];
}

const DEFAULT_STEPS = ['Landing', '1. Debt/Equity', '2. Stocks', '3. Balance', 'Results'];

export default function ProgressBar({ current, steps = DEFAULT_STEPS }: ProgressBarProps) {
  return (
    <div style={styles.progressBar} className="progress-bar">
      {steps.map((label, idx) => {
        const step = idx + 1;
        return (
          <div
            key={step}
            style={{
              ...styles.progressStep,
              backgroundColor: step < current ? '#a98a4f' : step === current ? '#2d4a2b' : '#d9d2c1'
            }}
            className="progress-step"
            title={label}
          >
            {step}
          </div>
        );
      })}
      <div style={styles.stepLabels}>
        {steps.map((label, idx) => (
          <span key={idx} style={{ ...styles.stepLabel, color: idx + 1 === current ? '#0f1f35' : '#6d6658' }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  progressBar: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    margin: '3rem 0',
    padding: '2rem 2rem 2.5rem',
    background: '#fbf9f4',
    border: '2px solid #d9d2c1',
    boxShadow: '0 2px 8px rgba(44, 44, 44, 0.08)'
  },
  progressStep: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    color: 'white',
    fontSize: '1.2rem'
  },
  stepLabels: {
    position: 'absolute',
    bottom: '-1.5rem',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 0.5rem',
    fontSize: '0.7rem',
    fontWeight: 600
  },
  stepLabel: {
    maxWidth: '18%',
    textAlign: 'center'
  }
};

