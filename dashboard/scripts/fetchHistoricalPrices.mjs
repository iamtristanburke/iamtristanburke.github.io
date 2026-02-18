#!/usr/bin/env node
/**
 * Fetches monthly adjusted-close historical prices. Writes to public/data/historicalPrices.json
 * so the deployed site can serve it and users can run backtests.
 * Run from dashboard/: node scripts/fetchHistoricalPrices.mjs
 * Quick mode (only SPY, AGG + 15 Colt Road stocks): QUICK=1 node scripts/fetchHistoricalPrices.mjs
 * Requires: npm install yahoo-finance2
 */

import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PERIOD1 = '2009-01-01';
const INTERVAL = '1mo';
const DELAY_MS = 350;
const RETRY_LIMIT = 4;
const RETRY_BASE_DELAY_MS = 1500;
const QUICK_TICKERS = ['SPY', 'AGG', 'ETN', 'NEE', 'MSFT', 'EQIX', 'GOOGL', 'AMZN', 'ABBV', 'JNJ', 'UNH', 'ABT', 'MDT', 'LMT', 'HON', 'GD', 'CAT'];
const OUT_DIR = `${__dirname}/../public/data`;
const OUT_PATH = `${OUT_DIR}/historicalPrices.json`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadAppSp500Tickers() {
  const sourcePath = `${__dirname}/../src/data/sp500Constituents.ts`;
  const src = readFileSync(sourcePath, 'utf8');
  const tickers = [];
  const re = /ticker:\s*"([^"]+)"/g;
  let match;
  while ((match = re.exec(src)) !== null) {
    if (match[1]) tickers.push(match[1]);
  }
  return [...new Set(tickers)];
}

function toYahooSymbol(symbol) {
  // Yahoo Finance uses dashes for class shares, e.g. BRK-B, BF-B.
  return symbol.replace(/\./g, '-');
}

function normalizeSeries(result) {
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
  return { dates, prices };
}

async function fetchSeriesWithRetry(yahooFinance, symbol) {
  const yahooSymbol = toYahooSymbol(symbol);
  let lastErr = null;
  for (let attempt = 1; attempt <= RETRY_LIMIT; attempt++) {
    try {
      const result = await yahooFinance.chart(yahooSymbol, {
        period1: PERIOD1,
        interval: INTERVAL
      });
      const series = normalizeSeries(result);
      if (series.dates.length < 2) {
        throw new Error(`insufficient data points (${series.dates.length})`);
      }
      return series;
    } catch (err) {
      lastErr = err;
      if (attempt < RETRY_LIMIT) {
        const waitMs = RETRY_BASE_DELAY_MS * attempt;
        console.warn(`Retry ${symbol} (${attempt}/${RETRY_LIMIT - 1}) after error: ${err.message}. Waiting ${waitMs}ms...`);
        await sleep(waitMs);
      }
    }
  }
  throw new Error(lastErr instanceof Error ? lastErr.message : String(lastErr));
}

async function main() {
  const YahooFinance = (await import('yahoo-finance2')).default;
  const yahooFinance = new YahooFinance();

  let tickers;
  if (process.env.QUICK === '1' || process.argv.includes('--quick')) {
    tickers = QUICK_TICKERS;
    console.log('Quick mode: fetching', tickers.length, 'tickers (SPY, AGG + Colt Road 15)');
  } else {
    const symbols = loadAppSp500Tickers();
    tickers = [...new Set([...symbols, 'SPY', 'AGG'])];
    console.log('Full mode: fetching', tickers.length, 'tickers (app S&P 500 universe + SPY + AGG)');
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const out = {};
  const failed = [];
  let done = 0;
  const total = tickers.length;

  for (const symbol of tickers) {
    try {
      out[symbol] = await fetchSeriesWithRetry(yahooFinance, symbol);
      done++;
      if (done % 50 === 0) console.log(`Fetched ${done}/${total}...`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failed.push(`${symbol} (${message})`);
      console.error(`Failed ${symbol}: ${message}`);
    }
    await sleep(DELAY_MS);
  }

  const lastUpdated = new Date().toISOString().slice(0, 10);
  const missing = tickers.filter((s) => !out[s] || out[s].dates.length < 2);
  if (missing.length > 0) {
    console.warn(`Missing or incomplete data for ${missing.length} ticker(s).`);
    console.warn(`Missing list: ${missing.slice(0, 50).join(', ')}${missing.length > 50 ? ' ...' : ''}`);
    if (failed.length > 0) {
      console.warn(`Failures (${failed.length}):`);
      for (const line of failed.slice(0, 50)) {
        console.warn(`- ${line}`);
      }
      if (failed.length > 50) console.warn(`... and ${failed.length - 50} more`);
    }
    if (process.env.STRICT === '1') {
      process.exit(1);
    }
  }
  const payload = { lastUpdated, prices: out, missingTickers: missing };
  writeFileSync(OUT_PATH, JSON.stringify(payload, null, 0), 'utf8');
  console.log(`Wrote ${Object.keys(out).length} tickers to ${OUT_PATH} (data as of ${lastUpdated})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
