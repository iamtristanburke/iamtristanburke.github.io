import { Stock } from '../types/colt-road';

export const generateStockDatabase = (): Stock[] => {
  const stocks: Stock[] = [];
  const sectors = ['Technology', 'Healthcare', 'Financials', 'Consumer Discretionary', 'Industrials', 'Energy', 'Consumer Staples', 'Utilities', 'Real Estate', 'Materials', 'Communication Services'];
  
  // S&P 500 - Top 50 real companies
  const sp500Top = [
    {ticker: 'AAPL', name: 'Apple Inc.', marketCap: 2800000, pe: 28.5, divYield: 0.5, sector: 'Technology'},
    {ticker: 'MSFT', name: 'Microsoft Corporation', marketCap: 2500000, pe: 32.1, divYield: 0.9, sector: 'Technology'},
    {ticker: 'GOOGL', name: 'Alphabet Inc.', marketCap: 1700000, pe: 24.3, divYield: 0.0, sector: 'Technology'},
    {ticker: 'AMZN', name: 'Amazon.com Inc.', marketCap: 1500000, pe: 58.2, divYield: 0.0, sector: 'Technology'},
    {ticker: 'NVDA', name: 'NVIDIA Corporation', marketCap: 1200000, pe: 65.4, divYield: 0.1, sector: 'Technology'},
    {ticker: 'META', name: 'Meta Platforms Inc.', marketCap: 890000, pe: 24.8, divYield: 0.0, sector: 'Technology'},
    {ticker: 'TSLA', name: 'Tesla Inc.', marketCap: 780000, pe: 72.3, divYield: 0.0, sector: 'Consumer Discretionary'},
    {ticker: 'BRK.B', name: 'Berkshire Hathaway Inc.', marketCap: 760000, pe: 8.9, divYield: 0.0, sector: 'Financials'},
    {ticker: 'LLY', name: 'Eli Lilly and Company', marketCap: 565000, pe: 68.7, divYield: 1.2, sector: 'Healthcare'},
    {ticker: 'V', name: 'Visa Inc.', marketCap: 520000, pe: 31.2, divYield: 0.7, sector: 'Financials'},
    {ticker: 'UNH', name: 'UnitedHealth Group Inc.', marketCap: 465000, pe: 22.4, divYield: 1.3, sector: 'Healthcare'},
    {ticker: 'XOM', name: 'Exxon Mobil Corporation', marketCap: 420000, pe: 10.2, divYield: 3.5, sector: 'Energy'},
    {ticker: 'AVGO', name: 'Broadcom Inc.', marketCap: 425000, pe: 28.9, divYield: 2.1, sector: 'Technology'},
    {ticker: 'WMT', name: 'Walmart Inc.', marketCap: 410000, pe: 24.7, divYield: 1.5, sector: 'Consumer Staples'},
    {ticker: 'JPM', name: 'JPMorgan Chase & Co.', marketCap: 480000, pe: 12.5, divYield: 2.8, sector: 'Financials'},
    {ticker: 'MA', name: 'Mastercard Inc.', marketCap: 390000, pe: 36.7, divYield: 0.5, sector: 'Financials'},
    {ticker: 'JNJ', name: 'Johnson & Johnson', marketCap: 385000, pe: 16.8, divYield: 3.1, sector: 'Healthcare'},
    {ticker: 'HD', name: 'The Home Depot Inc.', marketCap: 375000, pe: 21.9, divYield: 2.6, sector: 'Consumer Discretionary'},
    {ticker: 'PG', name: 'Procter & Gamble Co.', marketCap: 365000, pe: 25.3, divYield: 2.4, sector: 'Consumer Staples'},
    {ticker: 'COST', name: 'Costco Wholesale Corp.', marketCap: 295000, pe: 42.1, divYield: 0.7, sector: 'Consumer Staples'},
    {ticker: 'ABBV', name: 'AbbVie Inc.', marketCap: 285000, pe: 15.4, divYield: 3.7, sector: 'Healthcare'},
    {ticker: 'CVX', name: 'Chevron Corporation', marketCap: 285000, pe: 11.8, divYield: 3.8, sector: 'Energy'},
    {ticker: 'ORCL', name: 'Oracle Corporation', marketCap: 285000, pe: 32.1, divYield: 1.6, sector: 'Technology'},
    {ticker: 'BAC', name: 'Bank of America Corp.', marketCap: 265000, pe: 11.2, divYield: 2.9, sector: 'Financials'},
    {ticker: 'KO', name: 'The Coca-Cola Company', marketCap: 260000, pe: 24.5, divYield: 3.0, sector: 'Consumer Staples'},
    {ticker: 'PFE', name: 'Pfizer Inc.', marketCap: 245000, pe: 13.6, divYield: 4.2, sector: 'Healthcare'},
    {ticker: 'ADBE', name: 'Adobe Inc.', marketCap: 245000, pe: 43.2, divYield: 0.0, sector: 'Technology'},
    {ticker: 'MRK', name: 'Merck & Co. Inc.', marketCap: 245000, pe: 16.2, divYield: 2.8, sector: 'Healthcare'},
    {ticker: 'PEP', name: 'PepsiCo Inc.', marketCap: 235000, pe: 26.3, divYield: 2.6, sector: 'Consumer Staples'},
    {ticker: 'CRM', name: 'Salesforce Inc.', marketCap: 210000, pe: 52.8, divYield: 0.0, sector: 'Technology'},
    {ticker: 'CSCO', name: 'Cisco Systems Inc.', marketCap: 195000, pe: 17.8, divYield: 3.1, sector: 'Technology'},
    {ticker: 'AMD', name: 'Advanced Micro Devices', marketCap: 195000, pe: 54.3, divYield: 0.0, sector: 'Technology'},
    {ticker: 'ABT', name: 'Abbott Laboratories', marketCap: 195000, pe: 22.5, divYield: 1.9, sector: 'Healthcare'},
    {ticker: 'WFC', name: 'Wells Fargo & Company', marketCap: 185000, pe: 10.8, divYield: 2.7, sector: 'Financials'},
    {ticker: 'QCOM', name: 'QUALCOMM Inc.', marketCap: 185000, pe: 22.8, divYield: 2.2, sector: 'Technology'},
    {ticker: 'ACN', name: 'Accenture plc', marketCap: 185000, pe: 29.4, divYield: 1.5, sector: 'Technology'},
    {ticker: 'NFLX', name: 'Netflix Inc.', marketCap: 180000, pe: 38.6, divYield: 0.0, sector: 'Communication Services'},
    {ticker: 'DIS', name: 'The Walt Disney Company', marketCap: 175000, pe: 45.3, divYield: 0.0, sector: 'Communication Services'},
    {ticker: 'TXN', name: 'Texas Instruments Inc.', marketCap: 165000, pe: 24.6, divYield: 2.9, sector: 'Technology'},
    {ticker: 'CMCSA', name: 'Comcast Corporation', marketCap: 165000, pe: 13.4, divYield: 2.8, sector: 'Communication Services'},
    {ticker: 'VZ', name: 'Verizon Communications', marketCap: 165000, pe: 9.8, divYield: 6.8, sector: 'Communication Services'},
    {ticker: 'NKE', name: 'NIKE Inc.', marketCap: 155000, pe: 28.9, divYield: 1.2, sector: 'Consumer Discretionary'},
    {ticker: 'MS', name: 'Morgan Stanley', marketCap: 145000, pe: 13.2, divYield: 3.5, sector: 'Financials'},
    {ticker: 'AXP', name: 'American Express Company', marketCap: 145000, pe: 18.9, divYield: 1.3, sector: 'Financials'},
    {ticker: 'UNP', name: 'Union Pacific Corporation', marketCap: 145000, pe: 21.4, divYield: 2.3, sector: 'Industrials'},
    {ticker: 'HON', name: 'Honeywell International', marketCap: 135000, pe: 25.7, divYield: 2.0, sector: 'Industrials'},
    {ticker: 'CAT', name: 'Caterpillar Inc.', marketCap: 135000, pe: 16.8, divYield: 2.1, sector: 'Industrials'},
    {ticker: 'INTC', name: 'Intel Corporation', marketCap: 125000, pe: 18.7, divYield: 1.8, sector: 'Technology'},
    {ticker: 'T', name: 'AT&T Inc.', marketCap: 125000, pe: 7.2, divYield: 6.2, sector: 'Communication Services'},
    {ticker: 'GE', name: 'General Electric Company', marketCap: 125000, pe: 18.9, divYield: 0.5, sector: 'Industrials'}
  ];
  
  stocks.push(...sp500Top.map(s => ({...s, index: 'SP500' as const})));
  
  // Generate remaining S&P 500 (450 more) with real company names
  const realSP500Names = [
    'Salesforce Inc.', 'Adobe Inc.', 'Netflix Inc.', 'PayPal Holdings Inc.', 'Cisco Systems Inc.',
    'Comcast Corporation Class A', 'Intel Corporation', 'Broadcom Inc.', 'QUALCOMM Incorporated', 'Texas Instruments Inc.',
    'Applied Materials Inc.', 'Intuit Inc.', 'Advanced Micro Devices Inc.', 'Micron Technology Inc.', 'Analog Devices Inc.',
    'Lam Research Corporation', 'Airbnb Inc. Class A', 'Booking Holdings Inc.', 'Uber Technologies Inc.', 'Snowflake Inc. Class A',
    'Walmart Inc.', 'Costco Wholesale Corporation', 'The Procter & Gamble Company', 'PepsiCo Inc.', 'The Coca-Cola Company',
    'Philip Morris International Inc.', 'Altria Group Inc.', 'Mondelez International Inc. Class A', 'Colgate-Palmolive Company', 'The Estée Lauder Companies Inc. Class A',
    'Danaher Corporation', 'Thermo Fisher Scientific Inc.', 'Abbott Laboratories', 'Amgen Inc.', 'Gilead Sciences Inc.',
    'Moderna Inc.', 'Regeneron Pharmaceuticals Inc.', 'Vertex Pharmaceuticals Incorporated', 'Biogen Inc.', 'Illumina Inc.',
    'The Goldman Sachs Group Inc.', 'Morgan Stanley', 'The Charles Schwab Corporation', 'American Express Company', 'Visa Inc. Class A',
    'BlackRock Inc.', 'S&P Global Inc.', 'Moody\'s Corporation', 'CME Group Inc. Class A', 'Intercontinental Exchange Inc.',
    'ConocoPhillips', 'EOG Resources Inc.', 'Schlumberger NV', 'Marathon Petroleum Corporation', 'Valero Energy Corporation',
    'Phillips 66', 'Occidental Petroleum Corporation', 'Baker Hughes Company Class A', 'Halliburton Company', 'Devon Energy Corporation',
    'The Boeing Company', 'Lockheed Martin Corporation', 'RTX Corporation', 'General Electric Company', 'Honeywell International Inc.',
    'Caterpillar Inc.', 'Deere & Company', '3M Company', 'United Parcel Service Inc. Class B', 'FedEx Corporation',
    'Union Pacific Corporation', 'Norfolk Southern Corporation', 'CSX Corporation', 'Canadian National Railway Company', 'Canadian Pacific Railway Limited',
    'The Home Depot Inc.', 'Lowe\'s Companies Inc.', 'Nike Inc. Class B', 'Starbucks Corporation', 'McDonald\'s Corporation',
    'Target Corporation', 'TJX Companies Inc.', 'Ross Stores Inc.', 'Dollar General Corporation', 'Dollar Tree Inc.',
    'AT&T Inc.', 'Verizon Communications Inc.', 'T-Mobile US Inc.', 'Charter Communications Inc. Class A', 'Comcast Corporation Class A',
    'The Walt Disney Company', 'Warner Bros. Discovery Inc.', 'Paramount Global Class B', 'Fox Corporation Class A', 'Netflix Inc.',
    'Activision Blizzard Inc.', 'Electronic Arts Inc.', 'Take-Two Interactive Software Inc.', 'Roblox Corporation Class A', 'Unity Software Inc.',
    'Salesforce Inc.', 'Oracle Corporation', 'ServiceNow Inc.', 'Workday Inc. Class A', 'Atlassian Corporation Class A'
  ];
  
  for (let i = 0; i < 450; i++) {
    const baseName = realSP500Names[i % realSP500Names.length];
    const suffix = i >= realSP500Names.length ? ` ${Math.floor(i / realSP500Names.length) + 1}` : '';
    stocks.push({
      ticker: `SP${String(i).padStart(3, '0')}`,
      name: baseName + suffix,
      marketCap: 120000 - (i * 250),
      pe: 8 + Math.random() * 50,
      divYield: Math.random() * 6,
      sector: sectors[i % sectors.length],
      index: 'SP500'
    });
  }
  
  // Russell 2000 - 100 small cap stocks
  for (let i = 0; i < 100; i++) {
    stocks.push({
      ticker: `RSL${String(i).padStart(3, '0')}`,
      name: `Russell 2000 Company ${i + 1}`,
      marketCap: 5000 - (i * 40),
      pe: 10 + Math.random() * 60,
      divYield: Math.random() * 4,
      sector: sectors[i % sectors.length],
      index: 'RUSSELL2000'
    });
  }
  
  return stocks;
};

export const ALL_STOCKS = generateStockDatabase();

