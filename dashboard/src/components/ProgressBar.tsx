interface ProgressBarProps {
  current: number;
  steps?: string[];
  onStepClick?: (step: number) => void;
}

const DEFAULT_STEPS = ['Landing', 'Allocation', 'Stocks', 'Balance', 'Results'];

/** Bubble shows 1 above Allocation, 2 above Stocks, 3 above Balance, 4 above Results; Landing shows L. */
function bubbleLabel(step: number, isCompleted: boolean): string | number {
  if (isCompleted) return '✓';
  if (step === 1) return 'L'; // Landing
  return step - 1; // 2→1, 3→2, 4→3, 5→4
}

export default function ProgressBar({ current, steps = DEFAULT_STEPS, onStepClick }: ProgressBarProps) {
  const isClickable = !!onStepClick;

  return (
    <div style={styles.progressBar} className="progress-bar">
      <div style={styles.track}>
        {steps.map((label, idx) => {
          const step = idx + 1;
          const isCompleted = step < current;
          const isCurrent = step === current;
          const isUpcoming = step > current;

          return (
            <div key={step} style={styles.stepWrapper}>
              <button
                type="button"
                style={{
                  ...styles.stepButton,
                  ...(isClickable ? { cursor: 'pointer' } : { cursor: 'default' }),
                  ...(isCurrent ? styles.stepButtonCurrent : {}),
                  ...(isCompleted ? styles.stepButtonDone : {}),
                  ...(isUpcoming ? styles.stepButtonUpcoming : {})
                }}
                className={`progress-step${isClickable ? ' progress-step--clickable' : ''}`}
                title={label}
                onClick={isClickable ? () => onStepClick(step) : undefined}
                aria-label={`Go to step ${step}: ${label}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span
                  className="progress-step-bar"
                  style={{
                    ...styles.bar,
                    backgroundColor: isCompleted ? '#a98a4f' : isCurrent ? '#2d4a2b' : '#d9d2c1'
                  }}
                >
                  {bubbleLabel(step, isCompleted)}
                </span>
                <span
                  style={{
                    ...styles.label,
                    ...(isCurrent ? styles.labelCurrent : {}),
                    ...(isCompleted ? styles.labelDone : {}),
                    ...(isUpcoming ? styles.labelUpcoming : {})
                  }}
                >
                  {label}
                </span>
              </button>
              {idx < steps.length - 1 && (
                <div
                  style={{
                    ...styles.connector,
                    ...(step < current ? styles.connectorDone : {})
                  }}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  progressBar: {
    margin: '3rem 0',
    padding: '2rem 1.5rem',
    background: 'linear-gradient(180deg, #fbf9f4 0%, #f5f2eb 100%)',
    border: '1px solid #e0dcd2',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(45, 74, 43, 0.06), 0 1px 3px rgba(0,0,0,0.04)'
  },
  track: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 0,
    flexWrap: 'wrap',
    rowGap: '1.5rem'
  },
  stepWrapper: {
    display: 'flex',
    alignItems: 'center',
    flex: '1 1 0',
    minWidth: '80px',
    maxWidth: '140px'
  },
  connector: {
    flex: '1 1 0',
    minWidth: '12px',
    height: '3px',
    borderRadius: 2,
    backgroundColor: '#e0dcd2',
    margin: '0 4px'
  },
  connectorDone: {
    backgroundColor: '#a98a4f'
  },
  stepButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'background-color 0.2s ease, transform 0.15s ease'
  },
  stepButtonCurrent: {
    fontWeight: 700
  },
  stepButtonDone: {},
  stepButtonUpcoming: {},
  bar: {
    width: '48px',
    height: '32px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    color: 'white',
    fontSize: '0.95rem',
    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
  label: {
    fontFamily: "var(--font-serif, 'Cormorant Garamond', Georgia, serif)",
    fontSize: '0.9rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
    textAlign: 'center',
    lineHeight: 1.2
  },
  labelCurrent: {
    color: '#0f1f35',
    fontWeight: 700
  },
  labelDone: {
    color: '#5c5346'
  },
  labelUpcoming: {
    color: '#9a9185'
  }
};

