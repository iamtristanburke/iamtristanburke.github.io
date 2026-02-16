import type { Stock } from '../types/colt-road';
import { getFilterApiUrl } from '../config/coltRoadApi';

/**
 * LLM-powered stock filter. Configure via header "Configure" or set VITE_LLM_FILTER_API_URL in .env.
 *
 * Backend contract:
 *   POST body: { query: string, stocks: Array<{ ticker, name, sector, pe, marketCap, divYield }> }
 *   Response:  { tickers: string[] } — tickers that match the natural-language query.
 *
 * Example: use an LLM (OpenAI, Anthropic, etc.) with a prompt like "Given this list of
 * stocks and the user query, return the tickers that match. User query: ..."
 * If no API URL is set, a keyword/sector fallback is used (e.g. "energy" → Energy sector).
 */
export async function filterStocksWithLLM(query: string, stocks: Stock[]): Promise<string[]> {
  const q = query.trim().toLowerCase();
  if (!q) return stocks.map((s) => s.ticker);

  const apiUrl = getFilterApiUrl();
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          stocks: stocks.map((s) => ({
            ticker: s.ticker,
            name: s.name,
            sector: s.sector,
            pe: s.pe,
            marketCap: s.marketCap,
            divYield: s.divYield
          }))
        })
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = (await res.json()) as { tickers?: string[] };
      const tickers = Array.isArray(data.tickers) ? data.tickers : [];
      return tickers;
    } catch (err) {
      console.warn('LLM filter API failed, using keyword fallback:', err);
      return keywordFilterStocks(q, stocks);
    }
  }

  return keywordFilterStocks(q, stocks);
}

/**
 * Fallback when no API is configured: match query keywords to sectors and simple criteria.
 */
function keywordFilterStocks(query: string, stocks: Stock[]): string[] {
  const words = query.split(/\s+/).filter(Boolean);
  const sectorMap: Record<string, string[]> = {
    energy: ['Energy'],
    oil: ['Energy'],
    gas: ['Energy'],
    tech: ['Information Technology'],
    technology: ['Information Technology'],
    software: ['Information Technology'],
    healthcare: ['Health Care'],
    health: ['Health Care'],
    pharma: ['Health Care'],
    financial: ['Financials'],
    financials: ['Financials'],
    bank: ['Financials'],
    consumer: ['Consumer Discretionary', 'Consumer Staples'],
    retail: ['Consumer Discretionary', 'Consumer Staples'],
    industrial: ['Industrials'],
    industrials: ['Industrials'],
    materials: ['Materials'],
    utilities: ['Utilities'],
    realestate: ['Real Estate'],
    'real estate': ['Real Estate'],
    reit: ['Real Estate'],
    communication: ['Communication Services'],
    telecom: ['Communication Services']
  };

  const sectorsWanted = new Set<string>();
  let wantGrowth = false;
  let wantValue = false;
  let wantDividend = false;
  let wantIncome = false;

  for (const w of words) {
    const lower = w.toLowerCase();
    if (sectorMap[lower]) sectorsWanted.add(sectorMap[lower][0]);
    if (lower === 'growth' || lower === 'growth stocks') wantGrowth = true;
    if (lower === 'value' || lower === 'value stocks') wantValue = true;
    if (lower === 'dividend' || lower === 'dividends') wantDividend = true;
    if (lower === 'income') wantIncome = true;
  }

  // Multi-word sector
  const fullQuery = words.join(' ').toLowerCase();
  if (fullQuery.includes('real estate')) sectorsWanted.add('Real Estate');
  if (fullQuery.includes('consumer discretionary')) sectorsWanted.add('Consumer Discretionary');
  if (fullQuery.includes('consumer staples')) sectorsWanted.add('Consumer Staples');
  if (fullQuery.includes('information technology')) sectorsWanted.add('Information Technology');
  if (fullQuery.includes('communication services')) sectorsWanted.add('Communication Services');
  if (fullQuery.includes('health care')) sectorsWanted.add('Health Care');

  return stocks.filter((s) => {
    if (sectorsWanted.size > 0 && !sectorsWanted.has(s.sector)) return false;
    if (wantGrowth && s.pe > 0 && s.pe < 15) return false; // growth often higher P/E
    if (wantValue && s.pe > 0 && s.pe > 30) return false;  // value often lower P/E
    if ((wantDividend || wantIncome) && s.divYield <= 0) return false;
    return true;
  }).map((s) => s.ticker);
}

export function isLLMApiConfigured(): boolean {
  return Boolean(getFilterApiUrl());
}
