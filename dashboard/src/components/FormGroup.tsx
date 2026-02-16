import { ReactNode } from 'react';

interface FormGroupProps {
  label: string;
  children: ReactNode;
  /** Reserve min height for label so inputs align in multi-column grids */
  reserveLabelSpace?: boolean;
}

export default function FormGroup({ label, children, reserveLabelSpace }: FormGroupProps) {
  return (
    <div style={styles.formGroup}>
      <label style={{ ...styles.label, ...(reserveLabelSpace ? styles.labelReserved : {}) }}>{label}</label>
      {children}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  formGroup: {
    marginBottom: 0
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#2c2c2c',
    marginBottom: '0.6rem',
    lineHeight: 1.35
  },
  labelReserved: {
    minHeight: '2.5em'
  }
};

