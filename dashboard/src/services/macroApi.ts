import type { MarketMacroSnapshot } from '../types/colt-road';
import { getMacroApiUrl } from '../config/coltRoadApi';

/** Default snapshot when no macro API is configured or fetch fails. asOf is set by caller. */
export function getDefaultMacroSnapshot(asOf: string): MarketMacroSnapshot {
  return {
    asOf,
    dailyCommentary: 'Rates hold near recent ranges with the 10-year at 4.25%. Elevated CAPE and positive stock-bond correlation (see Colt Road\'s Research) support our 50/50 baseline: we avoid long-duration bonds and size equities for the bimodal regime until the Productivity–Wage Gap trigger signals a pivot.',
    tenYearTreasuryYieldPct: 4.25,
    twoYearTreasuryYieldPct: 4.52,
    sp500ForwardPE: 21.2,
    equityRiskPremiumEstimatePct: 3.8,
    fedFundsRatePct: 4.50,
    inflationCpiYoYPct: 2.9,
    investmentGradeCorpSpreadBps: 95,
    dividendYieldSp500Pct: 1.35,
    earningsYieldSp500Pct: 4.72,
    fedModelSpreadPct: 0.47,
    buffettIndicatorPct: 182,
    yieldCurveSpreadPct: -0.27,
    realTenYearYieldPct: 1.35,
    aiBaselineEquityPct: 50,
    aiBaselineRationale: 'Colt Road\'s Research concludes that a neutral 50% equities / 50% debt split is optimal in the current bimodal regime: elevated CAPE and positive stock-bond correlation support a balanced stance with short-duration debt. Your answers below amend this baseline to fit your horizon and risk tolerance.'
  };
}

/**
 * Fetch daily macro snapshot. Uses macro API URL if configured (Configure in header); otherwise returns default with asOf = today.
 * Call with today's date (YYYY-MM-DD) so metrics refresh each day.
 */
export async function fetchMacroSnapshot(today: string): Promise<MarketMacroSnapshot> {
  const url = getMacroApiUrl();
  if (!url) {
    return getDefaultMacroSnapshot(today);
  }
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`Macro API ${res.status}`);
    const data = await res.json();
    const snapshot = data as MarketMacroSnapshot;
    if (!snapshot || typeof snapshot.asOf !== 'string') throw new Error('Invalid macro response');
    return snapshot;
  } catch {
    return getDefaultMacroSnapshot(today);
  }
}
