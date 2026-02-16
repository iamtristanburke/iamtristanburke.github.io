import type { Stock } from '../types/colt-road';

const LLM_CHAT_API_URL = import.meta.env.VITE_LLM_CHAT_API_URL as string | undefined;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Send a user message in the context of a stock and get an assistant reply.
 * Backend contract:
 *   POST body: { stock: { ticker, name, sector, pe, marketCap, divYield }, messages: ChatMessage[], newMessage: string }
 *   Response:  { reply: string }
 * Set VITE_LLM_CHAT_API_URL in .env to enable.
 */
export async function sendStockChatMessage(
  stock: Stock,
  messages: ChatMessage[],
  newMessage: string
): Promise<string> {
  if (LLM_CHAT_API_URL) {
    try {
      const res = await fetch(LLM_CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock: {
            ticker: stock.ticker,
            name: stock.name,
            sector: stock.sector,
            pe: stock.pe,
            marketCap: stock.marketCap,
            divYield: stock.divYield
          },
          messages,
          newMessage
        })
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = (await res.json()) as { reply?: string };
      return typeof data.reply === 'string' ? data.reply : 'No reply received.';
    } catch (err) {
      console.warn('LLM chat API failed:', err);
      return "Colt Road isn't connected right now. Set VITE_LLM_CHAT_API_URL to enable questions about this stock.";
    }
  }
  return "Colt Road chat isn't configured. Set VITE_LLM_CHAT_API_URL in your environment to ask questions about this stock.";
}

export function isStockChatConfigured(): boolean {
  return Boolean(LLM_CHAT_API_URL);
}
