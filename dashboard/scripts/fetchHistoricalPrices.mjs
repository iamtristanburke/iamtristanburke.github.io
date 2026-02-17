#!/usr/bin/env node
/**
 * Fetches monthly adjusted-close historical prices for all S&P 500 constituents
 * plus SPY (S&P 500 index) and AGG (aggregate bonds). Writes src/data/historicalPrices.json.
 * Run from dashboard/: node scripts/fetchHistoricalPrices.mjs
 * Requires: npm install yahoo-finance2
 */

import { writeFileSync } from 'fs';

const PERIOD1 = '2009-01-01';
const INTERVAL = '1mo';
const DELAY_MS = 350;
const OUT_PATH = new URL('../src/data/historicalPrices.json', import.meta.url);

function parseCSVLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if ((c === ',' && !inQuotes) || c === '\r') {
      out.push(cur.trim());
      cur = '';
    } else cur += c;
  }
  out.push(cur.trim());
  return out;
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
  return res.text();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const YahooFinance = (await import('yahoo-finance2')).default;
  const yahooFinance = new YahooFinance();

  // S&P 500 symbols from same source as fetch-sp500
  const constituentsText = await fetchText(
    'https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv'
  );
  const lines = constituentsText.split('\n').filter(Boolean);
  const symbols = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const symbol = row[0];
    if (symbol) symbols.push(symbol);
  }

  const tickers = [...symbols, 'SPY', 'AGG'];
  const out = {};
  let done = 0;
  const total = tickers.length;

  for (const symbol of tickers) {
    try {
      const result = await yahooFinance.chart(symbol, {
        period1: PERIOD1,
        interval: INTERVAL
      });
      const quotes = result?.quotes ?? [];
      const dates = [];
      const prices = [];
      for (const q of quotes) {
        const price = q.adjClose ?? q.close;
        if (price != null && q.date) {
          dates.push(typeof q.date === 'string' ? q.date.slice(0, 10) : new Date(q.date).toISOString().slice(0, 10));
          prices.push(price);
        }
      }
      if (dates.length > 0) {
        out[symbol] = { dates, prices };
      }
      done++;
      if (done % 50 === 0) console.log(`Fetched ${done}/${total}...`);
    } catch (err) {
      console.warn(`Skip ${symbol}: ${err.message}`);
    }
    await sleep(DELAY_MS);
  }

  const lastUpdated = new Date().toISOString().slice(0, 10);
  const payload = { lastUpdated, prices: out };
  writeFileSync(OUT_PATH, JSON.stringify(payload, null, 0), 'utf8');
  console.log(`Wrote ${Object.keys(out).length} tickers to ${OUT_PATH.pathname} (data as of ${lastUpdated})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
