import { ReactNode } from 'react';

interface SectionProps {
  title: ReactNode;
  children: ReactNode;
}

export default function Section({ title, children }: SectionProps) {
  return (
    <div style={styles.section} className="section-container">
      <h2 style={styles.sectionHeader}>{title}</h2>
      {children}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  section: {
    background: '#fbf9f4',
    border: '1px solid rgba(168, 155, 132, 0.4)',
    padding: '3rem',
    marginBottom: '2.5rem',
    boxShadow: '0 4px 16px rgba(44, 44, 44, 0.08)',
    position: 'relative'
  },
  sectionHeader: {
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '2.2rem',
    fontWeight: 700,
    color: '#0f1f35',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '3px solid #a98a4f'
  }
};

