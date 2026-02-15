import { ReactNode } from 'react';

interface SectionProps {
  title: string;
  children: ReactNode;
}

export default function Section({ title, children }: SectionProps) {
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionHeader}>{title}</h2>
      {children}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  section: {
    background: '#fbf9f4',
    border: '3px solid #a89b84',
    padding: '3rem',
    marginBottom: '2.5rem',
    boxShadow: '0 6px 20px rgba(44, 44, 44, 0.12)',
    position: 'relative',
    borderLeft: '10px solid transparent',
    borderImage: 'linear-gradient(to bottom, #6b2737, #a98a4f, #2d4a2b, #9d5b3f, #1a2f4a) 1'
  },
  sectionHeader: {
    fontFamily: "'Libre Baskerville', serif",
    fontSize: '2.2rem',
    fontWeight: 700,
    color: '#0f1f35',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '3px solid #a98a4f'
  }
};

