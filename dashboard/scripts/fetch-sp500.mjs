#!/usr/bin/env node
/**
 * Fetches S&P 500 constituents + live fundamentals and writes src/data/sp500Constituents.ts.
 * Fundamentals source of truth: Yahoo Finance (market cap, trailing P/E, dividend yield, revenue history).
 * Fallback for missing fields: datasets/s-and-p-500-companies-financials CSV.
 * Includes 3-year revenue CAGR (%) computed from annual total revenue.
 *
 * Run: node scripts/fetch-sp500.mjs
 */

import { writeFileSync } from 'fs';
import YahooFinance from 'yahoo-finance2';

const RETRY_LIMIT = 3;
const DELAY_MS = 150;
const RETRY_BASE_DELAY_MS = 800;

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

function round1(n) {
  return Math.round(n * 10) / 10;
}

function parseNumber(v) {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function toYahooSymbol(symbol) {
  // Yahoo class-share convention, e.g. BRK.B -> BRK-B
  return symbol.replace(/\./g, '-');
}

function normalizeTickerKey(symbol) {
  return symbol.replace(/-/g, '.');
}

function computeRevenue3yCagrPct(financialSeriesRows) {
  const rows = (financialSeriesRows ?? [])
    .map((r) => ({
      endDate: new Date(r?.date ?? 0).getTime(),
      totalRevenue: parseNumber(r?.totalRevenue)
    }))
    .filter((r) => Number.isFinite(r.endDate) && r.endDate > 0 && r.totalRevenue != null && r.totalRevenue > 0)
    .sort((a, b) => b.endDate - a.endDate);

  if (rows.length < 4) return null;
  const latest = rows[0].totalRevenue;
  const threeYearsAgo = rows[3].totalRevenue;
  if (!latest || !threeYearsAgo || latest <= 0 || threeYearsAgo <= 0) return null;
  const cagr = Math.pow(latest / threeYearsAgo, 1 / 3) - 1;
  if (!Number.isFinite(cagr)) return null;
  return round1(cagr * 100);
}

async function fetchYahooFundamentals(yf, symbol) {
  const yahooSymbol = toYahooSymbol(symbol);
  let lastErr = null;

  for (let attempt = 1; attempt <= RETRY_LIMIT; attempt++) {
    try {
      const [q, financialSeries] = await Promise.all([
        yf.quoteSummary(yahooSymbol, {
          modules: ['price', 'summaryDetail', 'defaultKeyStatistics']
        }),
        yf.fundamentalsTimeSeries(yahooSymbol, {
          period1: '2018-01-01',
          type: 'annual',
          module: 'financials'
        })
      ]);

      const marketCapDollars = parseNumber(q?.price?.marketCap ?? q?.summaryDetail?.marketCap);
      const trailingPE = parseNumber(q?.summaryDetail?.trailingPE ?? q?.defaultKeyStatistics?.trailingPE);
      const dividendYieldDecimal = parseNumber(q?.summaryDetail?.dividendYield);
      const revenueGrowth3y = computeRevenue3yCagrPct(financialSeries);

      return {
        marketCap: marketCapDollars && marketCapDollars > 0 ? Math.round(marketCapDollars / 1e6) : null, // millions
        pe: trailingPE && trailingPE > 0 ? round1(trailingPE) : null,
        divYield: dividendYieldDecimal != null && dividendYieldDecimal >= 0 ? round1(dividendYieldDecimal * 100) : null,
        revenueGrowth3y
      };
    } catch (err) {
      lastErr = err;
      if (attempt < RETRY_LIMIT) {
        await sleep(RETRY_BASE_DELAY_MS * attempt);
      }
    }
  }

  throw new Error(lastErr instanceof Error ? lastErr.message : String(lastErr));
}

async function main() {
  const [constituentsText, financialsText] = await Promise.all([
    fetchText('https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv'),
    fetchText('https://raw.githubusercontent.com/datasets/s-and-p-500-companies-financials/master/data/constituents-financials.csv')
  ]);

  const constituentLines = constituentsText.split('\n').filter(Boolean);
  const financialLines = financialsText.split('\n').filter(Boolean);

  const constituents = new Map(); // Symbol -> { name, sector }
  for (let i = 1; i < constituentLines.length; i++) {
    const row = parseCSVLine(constituentLines[i]);
    const symbol = row[0];
    const security = row[1] || symbol;
    const gicsSector = row[2] || 'Unknown';
    constituents.set(symbol, { name: security, sector: gicsSector });
  }

  const csvFinancials = new Map(); // normalized symbol -> { pe, divYield, marketCap }
  for (let i = 1; i < financialLines.length; i++) {
    const row = parseCSVLine(financialLines[i]);
    const symbol = normalizeTickerKey(row[0]);
    const peRaw = parseNumber(row[4]);
    const divYieldRaw = parseNumber(row[5]); // decimal
    const marketCapRaw = parseNumber(row[9]); // dollars

    csvFinancials.set(symbol, {
      pe: peRaw && peRaw > 0 ? round1(peRaw) : null,
      divYield: divYieldRaw != null && divYieldRaw >= 0 ? round1(divYieldRaw * 100) : null,
      marketCap: marketCapRaw && marketCapRaw > 0 ? Math.round(marketCapRaw / 1e6) : null
    });
  }

  const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
  const stocks = [];
  const failures = [];
  const symbols = Array.from(constituents.keys());

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    const { name, sector } = constituents.get(symbol);
    const csv = csvFinancials.get(normalizeTickerKey(symbol)) || { pe: null, divYield: null, marketCap: null };

    let yahoo = { pe: null, divYield: null, marketCap: null, revenueGrowth3y: null };
    try {
      yahoo = await fetchYahooFundamentals(yf, symbol);
    } catch (err) {
      failures.push(`${symbol}: ${err instanceof Error ? err.message : String(err)}`);
    }

    stocks.push({
      ticker: symbol,
      name,
      marketCap: yahoo.marketCap ?? csv.marketCap ?? 0,
      pe: yahoo.pe ?? csv.pe ?? 0,
      divYield: yahoo.divYield ?? csv.divYield ?? 0,
      revenueGrowth3y: yahoo.revenueGrowth3y,
      sector,
      index: 'SP500'
    });

    if ((i + 1) % 50 === 0) {
      console.log(`Fetched ${i + 1}/${symbols.length} tickers...`);
    }
    await sleep(DELAY_MS);
  }

  const tsContent = `/**
 * S&P 500 constituents with GICS sectors and live fundamentals.
 * Generated by scripts/fetch-sp500.mjs using:
 *   - constituents.csv (name/sector universe)
 *   - Yahoo Finance quoteSummary (marketCap, trailingPE, dividendYield, revenue history)
 *   - financials CSV fallback when Yahoo field is unavailable
 * marketCap in millions, divYield in %, revenueGrowth3y in % CAGR.
 */

import { Stock } from '../types/colt-road';

export const SP500_STOCKS: Stock[] = ${JSON.stringify(stocks, null, 2).replace(/"([^"]+)":/g, '$1:')};
`;

  writeFileSync(new URL('../src/data/sp500Constituents.ts', import.meta.url), tsContent);
  console.log(`Wrote ${stocks.length} S&P 500 stocks to src/data/sp500Constituents.ts`);
  if (failures.length > 0) {
    console.warn(`Yahoo fetch failures for ${failures.length} ticker(s). Example:`);
    for (const line of failures.slice(0, 10)) console.warn(`- ${line}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
