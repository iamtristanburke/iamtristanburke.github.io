/**
 * Colt Road's 15 Best Ideas — aligned with Research: Stock Selection: The Ironclad Portfolio.
 * Themes match ColtRoadResearchModal (Digital Utilities, Physical Monopolies, Sovereign/Critical, Sleep-Well).
 * Only tickers present in the app's stock universe are included so they can be auto-selected.
 */

export const COLT_ROAD_BEST_IDEAS: { ticker: string; name: string; theme: string }[] = [
  // Theme I: Digital Utilities (Un-Disruptable Scale)
  { ticker: 'MSFT', name: 'Microsoft', theme: 'Digital utility: Azure, Windows, Office; balance sheet can weather any AI winter' },
  { ticker: 'GOOGL', name: 'Alphabet', theme: 'Search as nervous system of internet; YouTube and Android floor; often <20× P/E' },
  { ticker: 'AMZN', name: 'Amazon', theme: 'Logistics moat; AWS profit, warehouses/trucks/planes irreplaceable; railroad of digital age' },
  // Theme II: Physical Monopolies (Hard Moats) — CP omitted (not in S&P 500 data); COST added as retail compounder
  { ticker: 'WM', name: 'Waste Management', theme: 'NIMBY: landfill permits impossible; RNG from landfills; recession-proof, inflation-protected' },
  { ticker: 'LIN', name: 'Linde', theme: 'On-site industrial gas, 10–20 year take-or-pay; pass-through energy and inflation' },
  { ticker: 'SHW', name: 'Sherwin-Williams', theme: 'Controlled distribution, 5,000+ owned stores; pro-contractor relationship and pricing power' },
  { ticker: 'COST', name: 'Costco', theme: 'Retail compounder, membership model; sleep-well anchor' },
  // Theme III: Sovereign & Critical Infrastructure
  { ticker: 'GD', name: 'General Dynamics', theme: 'Nuclear submarines; one customer (US Navy), one provider; backlog for decades' },
  { ticker: 'LMT', name: 'Lockheed Martin', theme: 'F-35 backbone of NATO; infinite switching costs; secular defense spending' },
  { ticker: 'TDG', name: 'TransDigm', theme: 'FAA-certified proprietary aircraft parts; sole-source pricing; ~50% margins' },
  { ticker: 'ETN', name: 'Eaton', theme: 'Electrical backbone for US grid; switchgear and transformers for AI/EV buildout' },
  // Theme IV: Sleep-Well Anchors (Oligopolies)
  { ticker: 'COR', name: 'Cencora', theme: '~90% US drug distribution with McKesson, Cardinal; pharma volume, barrier to entry' },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway', theme: 'Fortress balance sheet; cash for distress; BNSF and energy in booms' },
  { ticker: 'VRSK', name: 'Verisk Analytics', theme: 'Data contributory consortium for insurers; subscription, near-zero churn' },
  { ticker: 'CTAS', name: 'Cintas', theme: 'Quality compounder; oligopoly in uniform and facility services' }
];

/** Ticker symbols only, for default selectedStocks. */
export const COLT_ROAD_BEST_IDEAS_TICKERS = COLT_ROAD_BEST_IDEAS.map(({ ticker }) => ticker);
