export const formatNumber = (num: number, decimals: number = 0): string => {
  return parseFloat(num.toString()).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export const formatCurrency = (num: number, decimals: number = 0): string => {
  return '$' + formatNumber(num, decimals);
};

export const formatMarketCap = (marketCap: number): string => {
  if (marketCap >= 1000000) {
    return '$' + formatNumber(marketCap / 1000000, 1) + 'T';
  } else if (marketCap >= 1000) {
    return '$' + formatNumber(marketCap / 1000, 1) + 'B';
  }
  return '$' + formatNumber(marketCap, 0) + 'M';
};

