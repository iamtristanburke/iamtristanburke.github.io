function clampPositionLimitPct(positionLimitPct?: number): number {
  if (!Number.isFinite(positionLimitPct as number)) return 100;
  return Math.max(0, Math.min(100, positionLimitPct as number));
}

/**
 * Enforce max-per-name concentration while preserving total weight = 1 when feasible.
 * If cap is infeasible for the number of names (cap * n < 1), equal-weight is returned.
 */
function applyMaxPositionCap(
  weights: Record<string, number>,
  selectedTickers: string[],
  positionLimitPct?: number
): Record<string, number> {
  const n = selectedTickers.length;
  if (n === 0) return {};
  const cap = clampPositionLimitPct(positionLimitPct) / 100;
  if (cap <= 0 || cap >= 1) return weights;
  if (cap * n < 1 - 1e-12) {
    const eq = 1 / n;
    return Object.fromEntries(selectedTickers.map((t) => [t, eq]));
  }

  const capped: Record<string, number> = {};
  for (const t of selectedTickers) capped[t] = Math.max(0, weights[t] ?? 0);

  // Iteratively cap overweight names and re-distribute residual to under-cap names.
  let changed = true;
  let guard = 0;
  while (changed && guard < 32) {
    guard += 1;
    changed = false;
    let fixedSum = 0;
    let freeSum = 0;
    const free: string[] = [];

    for (const t of selectedTickers) {
      const w = capped[t] ?? 0;
      if (w >= cap) fixedSum += cap;
      else {
        free.push(t);
        freeSum += w;
      }
    }

    const residual = Math.max(0, 1 - fixedSum);
    if (free.length === 0) break;

    if (freeSum <= 0) {
      const fill = residual / free.length;
      for (const t of free) {
        const next = Math.min(cap, fill);
        if (Math.abs((capped[t] ?? 0) - next) > 1e-12) changed = true;
        capped[t] = next;
      }
      continue;
    }

    for (const t of free) {
      const proportional = ((capped[t] ?? 0) / freeSum) * residual;
      const next = Math.min(cap, proportional);
      if (Math.abs((capped[t] ?? 0) - next) > 1e-12) changed = true;
      capped[t] = next;
    }
  }

  // Final normalize for numerical stability.
  const sum = selectedTickers.reduce((acc, t) => acc + (capped[t] ?? 0), 0);
  if (sum <= 0) {
    const eq = 1 / n;
    return Object.fromEntries(selectedTickers.map((t) => [t, eq]));
  }
  return Object.fromEntries(selectedTickers.map((t) => [t, (capped[t] ?? 0) / sum]));
}

/** Compute weight per ticker (fraction of equity). Sum = 1. */
export function getPortfolioWeights(
  selectedTickers: string[],
  positionLimitPct?: number
): Record<string, number> {
  const n = selectedTickers.length;
  if (n === 0) return {};
  const w = 1 / n;
  const base = Object.fromEntries(selectedTickers.map((t) => [t, w]));
  return applyMaxPositionCap(base, selectedTickers, positionLimitPct);
}
