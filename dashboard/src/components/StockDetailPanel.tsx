import { useState, useRef, useEffect } from 'react';
import type { Stock } from '../types/colt-road';
import { formatMarketCap } from '../utils/formatters';
import { sendStockChatMessage, type ChatMessage } from '../services/llmStockChat';

interface StockDetailPanelProps {
  stock: Stock;
  onClose: () => void;
}

export default function StockDetailPanel({ stock, onClose }: StockDetailPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const reply = await sendStockChatMessage(stock, [...messages, userMsg], text);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label={`Details for ${stock.name}`}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {stock.name} ({stock.ticker})
          </h2>
          <button type="button" onClick={onClose} style={styles.closeBtn} aria-label="Close">
            ×
          </button>
        </div>

        <div style={styles.financials}>
          <h3 style={styles.financialsTitle}>Key financials</h3>
          <dl style={styles.dl}>
            <div style={styles.dlRow}>
              <dt style={styles.dt}>Market cap</dt>
              <dd style={styles.dd}>{formatMarketCap(stock.marketCap)}</dd>
            </div>
            <div style={styles.dlRow}>
              <dt style={styles.dt}>P/E ratio</dt>
              <dd style={styles.dd}>{stock.pe > 0 ? stock.pe.toFixed(1) : '—'}</dd>
            </div>
            <div style={styles.dlRow}>
              <dt style={styles.dt}>Dividend yield</dt>
              <dd style={styles.dd}>{stock.divYield.toFixed(1)}%</dd>
            </div>
            <div style={styles.dlRow}>
              <dt style={styles.dt}>3Y revenue growth (CAGR)</dt>
              <dd style={styles.dd}>
                {stock.revenueGrowth3y != null && Number.isFinite(stock.revenueGrowth3y)
                  ? `${stock.revenueGrowth3y.toFixed(1)}%`
                  : '—'}
              </dd>
            </div>
            <div style={styles.dlRow}>
              <dt style={styles.dt}>Sector</dt>
              <dd style={styles.dd}>{stock.sector}</dd>
            </div>
          </dl>
        </div>

        <div style={styles.chatSection}>
          <h3 style={styles.chatTitle}>Ask Colt Road about {stock.ticker}</h3>
          <div style={styles.chatMessages}>
            {messages.length === 0 && !loading && (
              <p style={styles.placeholder}>Ask a question about this stock—e.g. risks, growth drivers, or how it fits the current theme.</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ ...styles.message, ...(msg.role === 'user' ? styles.messageUser : styles.messageAssistant) }}>
                {msg.role === 'assistant' && <span style={styles.messageLabel}>Colt Road</span>}
                <span style={styles.messageContent}>{msg.content}</span>
              </div>
            ))}
            {loading && (
              <div style={{ ...styles.message, ...styles.messageAssistant }}>
                <span style={styles.messageLabel}>Colt Road</span>
                <span style={styles.messageContent}>…</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSubmit} style={styles.form}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit(e))}
              placeholder="Ask a question..."
              style={styles.input}
              rows={2}
              disabled={loading}
              aria-label="Question about this stock"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                ...styles.sendBtn,
                ...(loading || !input.trim() ? { opacity: 0.6, cursor: 'not-allowed' } : {})
              }}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 31, 53, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '2rem'
  },
  panel: {
    background: '#f8f6f0',
    border: '2px solid #d9d2c1',
    borderRadius: '8px',
    maxWidth: '520px',
    width: '100%',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
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
    fontSize: '1.75rem',
    lineHeight: 1,
    color: '#6d6658',
    cursor: 'pointer',
    padding: '0.25rem'
  },
  financials: {
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #d9d2c1'
  },
  financialsTitle: {
    margin: '0 0 0.5rem 0',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#6d6658',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  dl: {
    margin: 0,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '0.25rem 1.5rem'
  },
  dlRow: {
    display: 'contents'
  },
  dt: {
    margin: 0,
    fontSize: '0.9rem',
    color: '#6d6658'
  },
  dd: {
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#0f1f35'
  },
  chatSection: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0
  },
  chatTitle: {
    margin: 0,
    padding: '0.75rem 1.25rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#0f1f35',
    borderBottom: '1px solid #d9d2c1'
  },
  chatMessages: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  placeholder: {
    margin: 0,
    fontSize: '0.9rem',
    color: '#6d6658',
    fontStyle: 'italic'
  },
  message: {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    maxWidth: '100%'
  },
  messageUser: {
    background: '#2d4a2b',
    color: 'white',
    alignSelf: 'flex-end'
  },
  messageAssistant: {
    background: 'white',
    border: '1px solid #d9d2c1',
    alignSelf: 'flex-start'
  },
  messageLabel: {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#6d6658',
    marginBottom: '0.25rem'
  },
  messageContent: {
    fontSize: '0.9rem',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  form: {
    display: 'flex',
    gap: '0.5rem',
    padding: '1rem 1.25rem',
    borderTop: '2px solid #d9d2c1',
    background: '#f0ede5'
  },
  input: {
    flex: 1,
    padding: '0.6rem 0.75rem',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '0.9rem',
    border: '2px solid #d9d2c1',
    borderRadius: '4px',
    resize: 'none',
    minHeight: '44px'
  },
  sendBtn: {
    padding: '0.6rem 1rem',
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '0.9rem',
    fontWeight: 600,
    background: '#2d4a2b',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    alignSelf: 'flex-end'
  }
};
