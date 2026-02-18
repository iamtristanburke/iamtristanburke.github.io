/** Compute weight per ticker (fraction of equity). Sum = 1. */
export function getPortfolioWeights(
  selectedTickers: string[]
): Record<string, number> {
  const n = selectedTickers.length;
  if (n === 0) return {};
  const w = 1 / n;
  return Object.fromEntries(selectedTickers.map((t) => [t, w]));
}
