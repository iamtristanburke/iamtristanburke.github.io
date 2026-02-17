import { PortfolioSizingMethod } from '../types/colt-road';
import { COLT_ROAD_CONVICTION_BY_TICKER } from '../data/coltRoadBestIdeas';

/** Compute weight per ticker (fraction of equity). Sum = 1. */
export function getPortfolioWeights(
  method: PortfolioSizingMethod,
  selectedTickers: string[],
  customWeights?: Record<string, number>
): Record<string, number> {
  const n = selectedTickers.length;
  if (n === 0) return {};

  if (method === 'equalWeight') {
    const w = 1 / n;
    return Object.fromEntries(selectedTickers.map((t) => [t, w]));
  }

  if (method === 'coltRoadConviction') {
    const score = (ticker: string) => COLT_ROAD_CONVICTION_BY_TICKER[ticker] ?? 10;
    const scores = selectedTickers.map((t) => score(t));
    const total = scores.reduce((a, b) => a + b, 0);
    return Object.fromEntries(selectedTickers.map((t, i) => [t, total > 0 ? scores[i] / total : 1 / n]));
  }

  if (method === 'customized' && customWeights) {
    const entries: [string, number][] = selectedTickers.map((t) => [t, Number(customWeights[t]) || 1 / n]);
    const sum = entries.reduce((a, [, v]) => a + v, 0);
    if (sum <= 0) return Object.fromEntries(selectedTickers.map((t) => [t, 1 / n]));
    return Object.fromEntries(entries.map(([t, v]) => [t, v / sum]));
  }

  return Object.fromEntries(selectedTickers.map((t) => [t, 1 / n]));
}
