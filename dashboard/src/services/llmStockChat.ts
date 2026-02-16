import type { Stock } from '../types/colt-road';
import { getChatApiUrl } from '../config/coltRoadApi';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Send a user message in the context of a stock and get an assistant reply.
 * Backend contract:
 *   POST body: { stock: { ticker, name, sector, pe, marketCap, divYield }, messages: ChatMessage[], newMessage: string }
 *   Response:  { reply: string }
 * Configure via header "Configure" or set VITE_LLM_CHAT_API_URL in .env.
 */
export async function sendStockChatMessage(
  stock: Stock,
  messages: ChatMessage[],
  newMessage: string
): Promise<string> {
  const apiUrl = getChatApiUrl();
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl, {
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
      return "Colt Road isn't connected right now. Use Configure in the header to set the Chat API URL.";
    }
  }
  return "Colt Road chat isn't configured. Click Configure in the header to add your Chat API URL.";
}

export function isStockChatConfigured(): boolean {
  return Boolean(getChatApiUrl());
}
