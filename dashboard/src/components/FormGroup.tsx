import { ReactNode } from 'react';

interface FormGroupProps {
  label: string;
  children: ReactNode;
}

export default function FormGroup({ label, children }: FormGroupProps) {
  return (
    <div style={styles.formGroup}>
      <label style={styles.label}>{label}</label>
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
    marginBottom: '0.6rem'
  }
};

