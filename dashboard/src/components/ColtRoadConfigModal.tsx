import { useState, useEffect } from 'react';
import { getChatApiUrl, getFilterApiUrl, getMacroApiUrl, setChatApiUrl, setFilterApiUrl, setMacroApiUrl } from '../config/coltRoadApi';

interface ColtRoadConfigModalProps {
  onClose: () => void;
}

export default function ColtRoadConfigModal({ onClose }: ColtRoadConfigModalProps) {
  const [chatUrl, setChatUrl] = useState('');
  const [filterUrl, setFilterUrl] = useState('');
  const [macroUrl, setMacroUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setChatUrl(getChatApiUrl() ?? '');
    setFilterUrl(getFilterApiUrl() ?? '');
    setMacroUrl(getMacroApiUrl() ?? '');
  }, []);

  const handleSave = () => {
    setChatApiUrl(chatUrl);
    setFilterApiUrl(filterUrl);
    setMacroApiUrl(macroUrl);
    setSaved(true);
    setTimeout(() => onClose(), 600);
  };

  return (
    <div style={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="colt-config-title">
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 id="colt-config-title" style={styles.title}>Configure Colt Road</h2>
          <button type="button" onClick={onClose} style={styles.closeBtn} aria-label="Close">×</button>
        </div>
        <p style={styles.hint}>
          Add your API endpoints so Colt Road can answer questions, filter stocks, and show daily market metrics.
          You can also set <code style={styles.code}>VITE_LLM_CHAT_API_URL</code>, <code style={styles.code}>VITE_LLM_FILTER_API_URL</code>, and <code style={styles.code}>VITE_MACRO_API_URL</code> in <code style={styles.code}>.env</code>.
        </p>
        <div style={styles.field}>
          <label style={styles.label}>Chat API URL</label>
          <input
            type="url"
            value={chatUrl}
            onChange={(e) => setChatUrl(e.target.value)}
            placeholder="https://your-api.com/chat"
            style={styles.input}
            autoComplete="url"
          />
          <span style={styles.fieldHint}>Used when you ask questions about a stock in the detail panel.</span>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Filter API URL</label>
          <input
            type="url"
            value={filterUrl}
            onChange={(e) => setFilterUrl(e.target.value)}
            placeholder="https://your-api.com/filter-stocks"
            style={styles.input}
            autoComplete="url"
          />
          <span style={styles.fieldHint}>Used for the natural-language stock search on the stock selection page.</span>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Macro API URL</label>
          <input
            type="url"
            value={macroUrl}
            onChange={(e) => setMacroUrl(e.target.value)}
            placeholder="https://your-api.com/macro"
            style={styles.input}
            autoComplete="url"
          />
          <span style={styles.fieldHint}>Daily market metrics (rates, P/E, allocation). Refreshes each day when set.</span>
        </div>
        <div style={styles.actions}>
          {saved && <span style={styles.savedText}>Saved.</span>}
          <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button type="button" onClick={handleSave} style={styles.saveBtn}>Save</button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 31, 53, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    padding: '2rem'
  },
  modal: {
    background: '#f8f6f0',
    border: '2px solid #d9d2c1',
    borderRadius: '8px',
    maxWidth: '520px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.25rem',
    borderBottom: '2px solid #d9d2c1',
    background: '#f0ede5'
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f1f35',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#6d6658',
    cursor: 'pointer',
    padding: '0.25rem'
  },
  hint: {
    margin: '1rem 1.25rem 0',
    fontSize: '0.9rem',
    color: '#6d6658',
    lineHeight: 1.5
  },
  code: {
    background: 'rgba(0,0,0,0.06)',
    padding: '0.1em 0.35em',
    borderRadius: '3px',
    fontSize: '0.85em'
  },
  field: {
    margin: '1.25rem 1.25rem 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem'
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#0f1f35'
  },
  input: {
    padding: '0.6rem 0.75rem',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '0.95rem',
    border: '2px solid #d9d2c1',
    borderRadius: '4px'
  },
  fieldHint: {
    fontSize: '0.8rem',
    color: '#6d6658'
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1.25rem 1.25rem',
    borderTop: '1px solid #d9d2c1',
    marginTop: '0.5rem'
  },
  savedText: {
    fontSize: '0.9rem',
    color: '#2d4a2b',
    fontWeight: 600
  },
  cancelBtn: {
    padding: '0.5rem 1rem',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '0.9rem',
    background: 'transparent',
    border: '1px solid #d9d2c1',
    color: '#6d6658',
    cursor: 'pointer',
    marginLeft: 'auto'
  },
  saveBtn: {
    padding: '0.5rem 1.25rem',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '0.9rem',
    fontWeight: 600,
    background: '#2d4a2b',
    color: 'white',
    border: 'none',
    cursor: 'pointer'
  }
};
