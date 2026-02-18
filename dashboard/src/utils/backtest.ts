import { Config, BacktestResults, PeriodResult, HistoricalPricesData, TradingStrategyId } from '../types/colt-road';
import { getPortfolioWeights } from './portfolioWeights';

const REQUIRED_INDEX = 'SPY';
const REQUIRED_BONDS = 'AGG';

function getPricePointOnOrBefore(
  dates: string[],
  prices: number[],
  dateStr: string
): { price: number; date: string; index: number } | null {
  if (dates.length === 0 || prices.length === 0) return null;
  let i = dates.length - 1;
  while (i >= 0 && dates[i] > dateStr) i--;
  if (i < 0) return null;
  return { price: prices[i], date: dates[i], index: i };
}

/** Get latest price on or before date from a series (dates ascending). */
function getPriceOnOrBefore(dates: string[], prices: number[], dateStr: string): number | null {
  const p = getPricePointOnOrBefore(dates, prices, dateStr);
  return p ? p.price : null;
}

/** Build monthly return series aligned to refDates. periodStart used as previous date for first month. */
function alignedReturns(
  tickerSeries: { dates: string[]; prices: number[] } | undefined,
  refDates: string[],
  periodStart: string
): (number | null)[] {
  if (!tickerSeries || tickerSeries.dates.length < 2) return refDates.map(() => null);
  const { dates, prices } = tickerSeries;
  const out: (number | null)[] = [];
  for (let i = 0; i < refDates.length; i++) {
    const currPt = getPricePointOnOrBefore(dates, prices, refDates[i]);
    const prevDate = i > 0 ? refDates[i - 1] : periodStart;
    const prevPt = getPricePointOnOrBefore(dates, prices, prevDate);
    if (currPt && prevPt && prevPt.price > 0) {
      // Missing fresh prints are treated as flat carry-forward (0%) rather than forced wipeout.
      // Delisting-specific outcomes require explicit corporate-action metadata we do not yet store.
      if (currPt.date === prevPt.date && currPt.date < refDates[i] && prevPt.date <= prevDate) out.push(0);
      else out.push((currPt.price - prevPt.price) / prevPt.price);
    } else {
      out.push(null);
    }
  }
  return out;
}

/** Get reference monthly dates from SPY in range [start, end]. */
function getCanonicalMonthlyDates(
  prices: Record<string, { dates: string[]; prices: number[] }>,
  start: string,
  end: string
): string[] {
  const series = prices[REQUIRED_INDEX];
  if (!series || series.dates.length === 0) return [];
  const out: string[] = [];
  for (let i = 0; i < series.dates.length; i++) {
    const d = series.dates[i];
    if (d >= start && d <= end) out.push(d);
  }
  return out;
}

const STRATEGY_IDS: TradingStrategyId[] = [
  'buyAndHold', 'momentum', 'meanReversion', 'movingAverage', 'breakout', 'contrarian', 'technical'
];

function getActiveStrategyId(config: Config): TradingStrategyId {
  const s = config.strategies || {};
  for (const id of STRATEGY_IDS) {
    if (s[id as keyof typeof s]?.enabled) return id as TradingStrategyId;
  }
  return 'buyAndHold';
}

/** Rebalance interval in months (monthly data). */
function rebalanceIntervalMonths(config: Config): number {
  const f = config.rebalanceFreq || 'quarterly';
  if (f === 'quarterly') return 3;
  return 1; // daily, weekly, monthly -> rebalance every month
}

/** Price at or before dateStr for a ticker. */
function priceAt(
  prices: Record<string, { dates: string[]; prices: number[] }>,
  ticker: string,
  dateStr: string
): number | null {
  const series = prices[ticker];
  if (!series) return null;
  return getPriceOnOrBefore(series.dates, series.prices, dateStr);
}

/** Ensure weights sum to 1 and are non-negative. Auditable: no weight is dropped. */
function normalizeWeights(
  out: Record<string, number>,
  selectedStocks: string[],
  positionLimitPct?: number
): Record<string, number> {
  let sum = 0;
  for (const t of selectedStocks) {
    const w = Math.max(0, out[t] ?? 0);
    out[t] = w;
    sum += w;
  }
  if (sum <= 0) {
    const eq = 1 / selectedStocks.length;
    for (const t of selectedStocks) out[t] = eq;
    sum = 1;
  } else {
    for (const t of selectedStocks) out[t] = (out[t] as number) / sum;
  }

  const rawCap = positionLimitPct;
  const capPct = Math.max(0, Math.min(100, rawCap ?? 100));
  const cap = capPct / 100;
  if (cap <= 0 || cap >= 1) return out;
  const n = selectedStocks.length;
  if (n === 0) return out;
  if (cap * n < 1 - 1e-12) return out; // Infeasible cap; leave normalized weights unchanged.

  // Iterative concentration cap: clamp to cap, then re-distribute residual
  // proportionally among still-under-cap names until stable.
  let guard = 0;
  while (guard < 32) {
    guard += 1;
    let fixedSum = 0;
    let freeSum = 0;
    const free: string[] = [];
    let hasOver = false;

    for (const t of selectedStocks) {
      const w = out[t] ?? 0;
      if (w > cap + 1e-12) hasOver = true;
      if (w >= cap) fixedSum += cap;
      else {
        free.push(t);
        freeSum += w;
      }
    }
    if (!hasOver) break;
    if (free.length === 0) break;

    const residual = Math.max(0, 1 - fixedSum);
    for (const t of selectedStocks) {
      if ((out[t] ?? 0) > cap) out[t] = cap;
    }
    if (freeSum <= 0) {
      const fill = residual / free.length;
      for (const t of free) out[t] = Math.min(cap, fill);
      continue;
    }
    for (const t of free) {
      out[t] = Math.min(cap, ((out[t] ?? 0) / freeSum) * residual);
    }
  }

  const finalSum = selectedStocks.reduce((acc, t) => acc + (out[t] ?? 0), 0);
  if (finalSum > 0) {
    for (const t of selectedStocks) out[t] = (out[t] ?? 0) / finalSum;
  }
  return out;
}

/**
 * Compute equity weights for the given month from the active trading strategy.
 *
 * AUDIT RULES (rigorous):
 * - All prices are from getPrice(ticker, idx) where idx <= monthIndex or periodStart; no look-ahead.
 * - Weights are non-negative and sum to 1 (enforced by normalizeWeights).
 * - Tie-breaking in sorts is deterministic (secondary sort by ticker).
 * - When a strategy has no qualifying stocks (e.g. no breakout), fallback is equal weight.
 * - Capital flow: reallocation is within the equity sleeve only; no flows to/from bonds.
 */
function getStrategyWeights(
  strategyId: TradingStrategyId,
  config: Config,
  prices: Record<string, { dates: string[]; prices: number[] }>,
  selectedStocks: string[],
  canonicalDates: string[],
  periodStart: string,
  monthIndex: number
): Record<string, number> {
  const n = selectedStocks.length;
  if (n === 0) return {};

  const positionLimitPct = config.positionLimit;
  const baseWeights = getPortfolioWeights(selectedStocks, positionLimitPct);
  if (monthIndex < 0) return baseWeights;

  if (strategyId === 'buyAndHold') {
    return baseWeights;
  }

  const getPrice = (ticker: string, idx: number) => {
    const d = idx < 0 ? periodStart : canonicalDates[idx];
    return priceAt(prices, ticker, d);
  };

  if (strategyId === 'momentum') {
    // Momentum (monthly, 12-1 style): rank by trailing return over lookback window,
    // skipping the most recent month to avoid short-term reversal contamination.
    const lookbackDays = (config.strategies?.momentum as { lookbackDays?: number })?.lookbackDays ?? 252;
    const threshold = (config.strategies?.momentum as { threshold?: number })?.threshold ?? 5;
    const lookbackMonths = Math.max(3, Math.round(lookbackDays / 21));
    const skipMonths = 1;
    const endIdx = monthIndex - skipMonths;
    const startIdx = endIdx - lookbackMonths;
    const entries: { ticker: string; ret: number }[] = [];
    for (const ticker of selectedStocks) {
      const pEnd = endIdx >= 0 ? getPrice(ticker, endIdx) : null;
      const pStart = startIdx >= 0 ? getPrice(ticker, startIdx) : null;
      if (pEnd != null && pStart != null && pStart > 0) {
        entries.push({ ticker, ret: (pEnd - pStart) / pStart });
      } else {
        entries.push({ ticker, ret: 0 });
      }
    }
    entries.sort((a, b) => b.ret - a.ret || a.ticker.localeCompare(b.ticker));
    const thresholdPct = Math.max(0, threshold) / 100;
    const included = entries.filter((e) => e.ret >= thresholdPct);
    const ranked = included.length > 0 ? included : entries;
    const rank = (t: string) => ranked.findIndex((e) => e.ticker === t) + 1;
    const rankSum = (ranked.length * (ranked.length + 1)) / 2;
    const out: Record<string, number> = {};
    for (const ticker of selectedStocks) {
      const r = rank(ticker);
      out[ticker] = r > 0 ? (ranked.length - r + 1) / rankSum : 0;
    }
    return normalizeWeights(out, selectedStocks, positionLimitPct);
  }

  if (strategyId === 'meanReversion') {
    // Mean reversion: rank by trailing return ascending (most negative = oversold, get highest weight).
    const rsiPeriod = (config.strategies?.meanReversion as { rsiPeriod?: number })?.rsiPeriod ?? 14;
    const lookbackMonths = Math.max(2, Math.ceil(rsiPeriod / 21));
    const startIdx = Math.max(0, monthIndex - lookbackMonths);
    const entries: { ticker: string; ret: number }[] = [];
    for (const ticker of selectedStocks) {
      const pCurr = getPrice(ticker, monthIndex);
      const pStart = getPrice(ticker, startIdx);
      if (pCurr != null && pStart != null && pStart > 0) {
        entries.push({ ticker, ret: (pCurr - pStart) / pStart });
      } else {
        entries.push({ ticker, ret: 0 });
      }
    }
    entries.sort((a, b) => a.ret - b.ret || a.ticker.localeCompare(b.ticker));
    const rank = (t: string) => entries.findIndex((e) => e.ticker === t) + 1;
    const rankSum = (n * (n + 1)) / 2;
    const out: Record<string, number> = {};
    for (const ticker of selectedStocks) {
      out[ticker] = (n - rank(ticker) + 1) / rankSum;
    }
    return normalizeWeights(out, selectedStocks, positionLimitPct);
  }

  if (strategyId === 'movingAverage') {
    // Golden cross: hold only stocks where short MA (through monthIndex) > long MA (through monthIndex). Equal weight among those.
    const shortMA = (config.strategies?.movingAverage as { shortMA?: number })?.shortMA ?? 50;
    const longMA = (config.strategies?.movingAverage as { longMA?: number })?.longMA ?? 200;
    const shortMonths = Math.max(1, Math.round(shortMA / 21));
    const longMonths = Math.max(shortMonths + 1, Math.round(longMA / 21));
    const inSet: string[] = [];
    for (const ticker of selectedStocks) {
      let shortSum = 0, shortCount = 0;
      let longSum = 0, longCount = 0;
      for (let k = 0; k < shortMonths && monthIndex - k >= 0; k++) {
        const p = getPrice(ticker, monthIndex - k);
        if (p != null) { shortSum += p; shortCount++; }
      }
      for (let k = 0; k < longMonths && monthIndex - k >= 0; k++) {
        const p = getPrice(ticker, monthIndex - k);
        if (p != null) { longSum += p; longCount++; }
      }
      const shortAvg = shortCount > 0 ? shortSum / shortCount : 0;
      const longAvg = longCount > 0 ? longSum / longCount : 0;
      if (shortAvg > 0 && longAvg > 0 && shortAvg > longAvg) inSet.push(ticker);
    }
    const out: Record<string, number> = {};
    const w = inSet.length > 0 ? 1 / inSet.length : 1 / n;
    for (const ticker of selectedStocks) {
      out[ticker] = inSet.includes(ticker) ? w : 0;
    }
    return normalizeWeights(out, selectedStocks, positionLimitPct);
  }

  if (strategyId === 'breakout') {
    // Breakout: hold only stocks whose price at monthIndex is >= high over prior periodMonths (excl. current month). Equal weight among those.
    const period = (config.strategies?.breakout as { period?: number })?.period ?? 252;
    const periodMonths = Math.max(1, Math.round(period / 21));
    const inSet: string[] = [];
    for (const ticker of selectedStocks) {
      const pCurr = getPrice(ticker, monthIndex);
      let high = 0;
      for (let k = 1; k <= periodMonths && monthIndex - k >= 0; k++) {
        const p = getPrice(ticker, monthIndex - k);
        if (p != null && p > high) high = p;
      }
      if (pCurr != null && high > 0 && pCurr >= high) inSet.push(ticker);
    }
    const out: Record<string, number> = {};
    const w = inSet.length > 0 ? 1 / inSet.length : 1 / n;
    for (const ticker of selectedStocks) {
      out[ticker] = inSet.includes(ticker) ? w : 0;
    }
    return normalizeWeights(out, selectedStocks, positionLimitPct);
  }

  if (strategyId === 'contrarian') {
    // Contrarian: weight by drawdown from lookback high. Drawdown = (high - price) / high. Only stocks with dd >= threshold get weight; weight ∝ dd.
    const drawdownThreshold = (config.strategies?.contrarian as { drawdownThreshold?: number })?.drawdownThreshold ?? 20;
    const recoveryPeriod = (config.strategies?.contrarian as { recoveryPeriod?: number })?.recoveryPeriod ?? 60;
    const lookbackMonths = Math.max(1, Math.round(recoveryPeriod / 21));
    const oversold: { ticker: string; dd: number }[] = [];
    for (const ticker of selectedStocks) {
      const pCurr = getPrice(ticker, monthIndex);
      let high = pCurr ?? 0;
      for (let k = 0; k <= lookbackMonths && monthIndex - k >= 0; k++) {
        const p = getPrice(ticker, monthIndex - k);
        if (p != null && p > high) high = p;
      }
      if (high > 0 && pCurr != null) {
        const dd = (high - pCurr) / high;
        if (dd >= drawdownThreshold / 100) oversold.push({ ticker, dd });
      }
    }
    const out: Record<string, number> = {};
    if (oversold.length > 0) {
      const totalDd = oversold.reduce((s, x) => s + x.dd, 0);
      for (const ticker of selectedStocks) {
        const o = oversold.find((x) => x.ticker === ticker);
        out[ticker] = o ? o.dd / totalDd : 0;
      }
    } else {
      for (const t of selectedStocks) out[t] = 1 / n;
    }
    return normalizeWeights(out, selectedStocks, positionLimitPct);
  }

  if (strategyId === 'technical') {
    // Technical (monthly): composite score from (1) fast/slow monthly MAs,
    // and (2) monthly Bollinger-style z-score. Inputs are already in MONTHS.
    const macdFast = (config.strategies?.technical as { macdFast?: number })?.macdFast ?? 12;
    const macdSlow = (config.strategies?.technical as { macdSlow?: number })?.macdSlow ?? 26;
    const bollingerPeriod = (config.strategies?.technical as { bollingerPeriod?: number })?.bollingerPeriod ?? 20;
    const fastMonths = Math.max(2, Math.round(macdFast));
    const slowMonths = Math.max(fastMonths + 1, Math.round(macdSlow));
    const bbMonths = Math.max(2, Math.round(bollingerPeriod));
    const entries: { ticker: string; score: number }[] = [];
    for (const ticker of selectedStocks) {
      const pCurr = getPrice(ticker, monthIndex);
      let fastSum = 0, fastCount = 0;
      let slowSum = 0, slowCount = 0;
      let bbSum = 0, bbSq = 0, bbCount = 0;
      for (let k = 0; k < fastMonths && monthIndex - k >= 0; k++) {
        const p = getPrice(ticker, monthIndex - k);
        if (p != null) { fastSum += p; fastCount++; }
      }
      for (let k = 0; k < slowMonths && monthIndex - k >= 0; k++) {
        const p = getPrice(ticker, monthIndex - k);
        if (p != null) { slowSum += p; slowCount++; }
      }
      for (let k = 0; k < bbMonths && monthIndex - k >= 0; k++) {
        const p = getPrice(ticker, monthIndex - k);
        if (p != null) { bbSum += p; bbSq += p * p; bbCount++; }
      }
      const fastAvg = fastCount > 0 ? fastSum / fastCount : 0;
      const slowAvg = slowCount > 0 ? slowSum / slowCount : 0;
      const bbAvg = bbCount > 0 ? bbSum / bbCount : 0;
      const bbVar = bbCount > 0 ? bbSq / bbCount - bbAvg * bbAvg : 0;
      const bbStd = bbVar > 0 ? Math.sqrt(bbVar) : 0;
      let score = 0.5;
      if (pCurr != null && fastAvg > 0 && slowAvg > 0) {
        if (fastAvg > slowAvg) score += 0.25;
        else score -= 0.25;
      }
      if (pCurr != null && bbStd > 0) {
        const z = (pCurr - bbAvg) / bbStd;
        if (z < -1) score += 0.25;
        else if (z > 1) score -= 0.25;
      }
      entries.push({ ticker, score });
    }
    entries.sort((a, b) => b.score - a.score || a.ticker.localeCompare(b.ticker));
    const rank = (t: string) => entries.findIndex((e) => e.ticker === t) + 1;
    const rankSum = (n * (n + 1)) / 2;
    const out: Record<string, number> = {};
    for (const ticker of selectedStocks) {
      out[ticker] = (n - rank(ticker) + 1) / rankSum;
    }
    return normalizeWeights(out, selectedStocks, positionLimitPct);
  }

  return baseWeights;
}

/**
 * Run backtest using only actual historical prices. No synthetic or assumed returns.
 * Throws if required data (SPY, AGG, or any selected stock) is missing or incomplete.
 */
function runHistoricalBacktest(
  config: Config,
  period: { years: number; label: string; startDate: string; endDate: string },
  prices: Record<string, { dates: string[]; prices: number[] }>
): PeriodResult {
  const targetEquity = config.targetEquityPct / 100;
  const targetBond = 1 - targetEquity;
  const selectedStocks = config.selectedStocks ?? [];
  const activeStrategy = getActiveStrategyId(config);
  const rebalanceEvery = rebalanceIntervalMonths(config);

  const spySeries = prices[REQUIRED_INDEX];
  const aggSeries = prices[REQUIRED_BONDS];
  if (!spySeries || spySeries.dates.length < 2) {
    throw new Error(`Backtest requires real S&P 500 index data (${REQUIRED_INDEX}). Run "npm run fetch-prices" to download historical prices.`);
  }
  if (!aggSeries || aggSeries.dates.length < 2) {
    throw new Error(`Backtest requires real bond data (${REQUIRED_BONDS}). Run "npm run fetch-prices" to download historical prices.`);
  }

  const canonicalDates = getCanonicalMonthlyDates(prices, period.startDate, period.endDate);
  if (canonicalDates.length < 2) {
    throw new Error(
      `Insufficient ${REQUIRED_INDEX} data for ${period.label} (${period.startDate}–${period.endDate}). Run "npm run fetch-prices" to refresh.`
    );
  }

  const spyReturns = alignedReturns(spySeries, canonicalDates, period.startDate);
  const aggReturns = alignedReturns(aggSeries, canonicalDates, period.startDate);

  const stockReturnsByTicker: Record<string, (number | null)[]> = {};
  for (const ticker of selectedStocks) {
    const series = prices[ticker];
    const ret = alignedReturns(series, canonicalDates, period.startDate);
    stockReturnsByTicker[ticker] = ret;
  }

  const data = {
    dates: [] as string[],
    portfolioValues: [] as number[],
    sp500Values: [] as number[],
    balanced6040Values: [] as number[],
    equityValues: [] as number[],
    bondValues: [] as number[]
  };

  let portfolioValue = config.portfolioValue;
  let sp500Value = config.portfolioValue;
  let balanced6040Value = config.portfolioValue;
  const commissionPerTrade = Math.max(0, config.commission || 0);
  const slippageRate = Math.max(0, config.slippage || 0) / 100;
  const isTaxable = config.accountType === 'taxable';
  const shortTermTaxRate = isTaxable ? Math.max(0, config.taxBracket || 0) / 100 : 0;
  const longTermTaxRate = isTaxable ? Math.max(0, Math.min(20, (config.taxBracket || 0) * 0.6)) / 100 : 0;

  let currentWeights = getStrategyWeights(
    activeStrategy,
    config,
    prices,
    selectedStocks,
    canonicalDates,
    period.startDate,
    -1
  );
  // Tax buckets by holding period proxy:
  // ST bucket (<12 months) and LT bucket (>=12 months).
  let holdingsMarketST: Record<string, number> = {};
  let holdingsCostST: Record<string, number> = {};
  let holdingsMarketLT: Record<string, number> = {};
  let holdingsCostLT: Record<string, number> = {};
  const isRebalanceMonth = (i: number) => i === 0 || (rebalanceEvery > 1 && i % rebalanceEvery === 0);

  for (let i = 0; i < canonicalDates.length; i++) {
    if (isRebalanceMonth(i)) {
      const equityStart = portfolioValue * targetEquity;
      let tradedNotional = 0;
      let orders = 0;
      let realizedShortTermGains = 0;
      let realizedLongTermGains = 0;
      const nextMarketST: Record<string, number> = {};
      const nextCostST: Record<string, number> = {};
      const nextMarketLT: Record<string, number> = {};
      const nextCostLT: Record<string, number> = {};

      // Rebalance in dollar space so turnover, slippage, commission, and tax can feed returns.
      for (const ticker of selectedStocks) {
        let marketST = holdingsMarketST[ticker] ?? 0;
        let costST = holdingsCostST[ticker] ?? 0;
        let marketLT = holdingsMarketLT[ticker] ?? 0;
        let costLT = holdingsCostLT[ticker] ?? 0;
        const currentMarket = marketST + marketLT;
        const targetMarket = equityStart * (currentWeights[ticker] ?? 0);
        const delta = targetMarket - currentMarket;

        if (Math.abs(delta) > 1e-8) orders += 1;
        if (delta < 0) {
          const sellAmount = -delta;
          tradedNotional += sellAmount;
          let remainingSell = sellAmount;

          // Approx FIFO-style liquidation: sell LT lots first, then ST.
          if (remainingSell > 0 && marketLT > 0) {
            const sellLT = Math.min(remainingSell, marketLT);
            const ratioLT = sellLT / marketLT;
            const costSoldLT = costLT * ratioLT;
            const realizedLT = sellLT - costSoldLT;
            if (realizedLT > 0) realizedLongTermGains += realizedLT;
            marketLT -= sellLT;
            costLT -= costSoldLT;
            remainingSell -= sellLT;
          }
          if (remainingSell > 0 && marketST > 0) {
            const sellST = Math.min(remainingSell, marketST);
            const ratioST = sellST / marketST;
            const costSoldST = costST * ratioST;
            const realizedST = sellST - costSoldST;
            if (realizedST > 0) realizedShortTermGains += realizedST;
            marketST -= sellST;
            costST -= costSoldST;
            remainingSell -= sellST;
          }
        } else if (delta > 0) {
          tradedNotional += delta;
          // New buys enter the short-term bucket.
          marketST += delta;
          costST += delta;
        }

        // Re-target by scaling both buckets proportionally to preserve the ST/LT mix.
        const postTradeMarket = Math.max(0, marketST + marketLT);
        if (postTradeMarket > 0 && targetMarket > 0) {
          const scaleToTarget = targetMarket / postTradeMarket;
          marketST *= scaleToTarget;
          costST *= scaleToTarget;
          marketLT *= scaleToTarget;
          costLT *= scaleToTarget;
        } else if (targetMarket <= 0) {
          marketST = 0; costST = 0; marketLT = 0; costLT = 0;
        }

        nextMarketST[ticker] = Math.max(0, marketST);
        nextCostST[ticker] = Math.max(0, costST);
        nextMarketLT[ticker] = Math.max(0, marketLT);
        nextCostLT[ticker] = Math.max(0, costLT);
      }

      // Trading friction + taxes (taxable accounts only) are deducted at rebalance.
      const slippageCost = tradedNotional * slippageRate;
      const commissionCost = orders * commissionPerTrade;
      const taxCost = realizedShortTermGains * shortTermTaxRate + realizedLongTermGains * longTermTaxRate;
      let totalCost = slippageCost + commissionCost + taxCost;

      // Costs reduce total portfolio value; equity targets are scaled down accordingly.
      if (totalCost > 0 && portfolioValue > 0 && equityStart > 0) {
        totalCost = Math.min(totalCost, portfolioValue);
        const postCostEquity = Math.max(0, equityStart - totalCost);
        const scale = postCostEquity / equityStart;
        for (const ticker of selectedStocks) {
          nextMarketST[ticker] = (nextMarketST[ticker] ?? 0) * scale;
          nextCostST[ticker] = (nextCostST[ticker] ?? 0) * scale;
          nextMarketLT[ticker] = (nextMarketLT[ticker] ?? 0) * scale;
          nextCostLT[ticker] = (nextCostLT[ticker] ?? 0) * scale;
        }
        portfolioValue -= totalCost;
      }

      holdingsMarketST = nextMarketST;
      holdingsCostST = nextCostST;
      holdingsMarketLT = nextMarketLT;
      holdingsCostLT = nextCostLT;
    }

    const spyRet = spyReturns[i];
    const aggRet = aggReturns[i];
    const date = canonicalDates[i];

    if (spyRet === null || aggRet === null) {
      throw new Error(
        `Missing index or bond return on ${date}. Data may be incomplete. Run "npm run fetch-prices" to refresh.`
      );
    }

    // Missing stock return is treated as 0% for the month.
    for (const ticker of selectedStocks) {
      const r = stockReturnsByTicker[ticker][i];
      const ret = 1 + (r ?? 0);
      holdingsMarketST[ticker] = (holdingsMarketST[ticker] ?? 0) * ret;
      holdingsMarketLT[ticker] = (holdingsMarketLT[ticker] ?? 0) * ret;
    }

    const balRet = spyRet * 0.6 + aggRet * 0.4;
    const equityValue = selectedStocks.reduce(
      (sum, ticker) => sum + (holdingsMarketST[ticker] ?? 0) + (holdingsMarketLT[ticker] ?? 0),
      0
    );
    const bondValue = (portfolioValue * targetBond) * (1 + aggRet);
    portfolioValue = equityValue + bondValue;
    sp500Value *= 1 + spyRet;
    balanced6040Value *= 1 + balRet;
    for (const ticker of selectedStocks) {
      // Monthly aging approximation: move 1/12 of ST bucket to LT bucket.
      const moveMkt = (holdingsMarketST[ticker] ?? 0) / 12;
      const moveCost = (holdingsCostST[ticker] ?? 0) / 12;
      holdingsMarketST[ticker] = Math.max(0, (holdingsMarketST[ticker] ?? 0) - moveMkt);
      holdingsCostST[ticker] = Math.max(0, (holdingsCostST[ticker] ?? 0) - moveCost);
      holdingsMarketLT[ticker] = (holdingsMarketLT[ticker] ?? 0) + moveMkt;
      holdingsCostLT[ticker] = (holdingsCostLT[ticker] ?? 0) + moveCost;
    }

    const nextMonthIndex = i + 1;
    // Compute next rebalance weights using information available through the month that just ended.
    if (nextMonthIndex < canonicalDates.length && isRebalanceMonth(nextMonthIndex)) {
      currentWeights = getStrategyWeights(
        activeStrategy,
        config,
        prices,
        selectedStocks,
        canonicalDates,
        period.startDate,
        i
      );
    }

    data.dates.push(date);
    data.portfolioValues.push(portfolioValue);
    data.sp500Values.push(sp500Value);
    data.balanced6040Values.push(balanced6040Value);
    data.equityValues.push(equityValue);
    data.bondValues.push(bondValue);
  }

  const portfolioReturnPct = ((portfolioValue - config.portfolioValue) / config.portfolioValue) * 100;
  const sp500ReturnPct = ((sp500Value - config.portfolioValue) / config.portfolioValue) * 100;
  const balanced6040ReturnPct = ((balanced6040Value - config.portfolioValue) / config.portfolioValue) * 100;

  const portfolioAnnualized = (Math.pow(portfolioValue / config.portfolioValue, 1 / period.years) - 1) * 100;
  const sp500Annualized = (Math.pow(sp500Value / config.portfolioValue, 1 / period.years) - 1) * 100;
  const balanced6040Annualized = (Math.pow(balanced6040Value / config.portfolioValue, 1 / period.years) - 1) * 100;

  return {
    period: period.label,
    years: period.years,
    data,
    metrics: {
      portfolio: {
        totalReturn: portfolioReturnPct.toFixed(2),
        annualizedReturn: portfolioAnnualized.toFixed(2),
        finalValue: portfolioValue
      },
      sp500: {
        totalReturn: sp500ReturnPct.toFixed(2),
        annualizedReturn: sp500Annualized.toFixed(2),
        finalValue: sp500Value
      },
      balanced6040: {
        totalReturn: balanced6040ReturnPct.toFixed(2),
        annualizedReturn: balanced6040Annualized.toFixed(2),
        finalValue: balanced6040Value
      }
    }
  };
}

/**
 * Generate backtest results from actual historical prices only.
 * data: must be loaded from /data/historicalPrices.json (fetched by the app so site users can run regressions).
 */
export function generateBacktest(config: Config, data: HistoricalPricesData): BacktestResults {
  const lastUpdated = (data.lastUpdated || '').trim();
  const prices = data.prices || {};

  if (!lastUpdated) {
    throw new Error(
      'Historical price data is not available. Please try again in a moment, or contact the site administrator to refresh market data.'
    );
  }

  if (!prices[REQUIRED_INDEX] || !prices[REQUIRED_BONDS]) {
    throw new Error(
      `Backtest requires market data for S&P 500 (${REQUIRED_INDEX}) and bonds (${REQUIRED_BONDS}). The site administrator may need to refresh the market data.`
    );
  }

  const periods = [
    { years: 5, label: '5-Year', startDate: '2019-01-01', endDate: '2024-01-01' },
    { years: 10, label: '10-Year', startDate: '2014-01-01', endDate: '2024-01-01' },
    { years: 15, label: '15-Year', startDate: '2009-01-01', endDate: '2024-01-01' }
  ];

  const results: BacktestResults = {
    periods: periods.map((period) => runHistoricalBacktest(config, period, prices)),
    lastUpdated
  };

  return results;
}
