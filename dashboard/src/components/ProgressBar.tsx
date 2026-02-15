interface ProgressBarProps {
  current: number;
}

export default function ProgressBar({ current }: ProgressBarProps) {
  return (
    <div style={styles.progressBar}>
      {[1, 2, 3, 4, 5].map(step => (
        <div
          key={step}
          style={{
            ...styles.progressStep,
            backgroundColor: step < current ? '#a98a4f' : step === current ? '#2d4a2b' : '#d9d2c1'
          }}
        >
          {step}
        </div>
      ))}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  progressBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    margin: '3rem 0',
    padding: '2rem',
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
  }
};

