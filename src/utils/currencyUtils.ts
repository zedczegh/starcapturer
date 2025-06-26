
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (isNaN(amount)) return '0';
  
  // Handle different currency symbols
  const currencyMap: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
    '$': '$',
    '€': '€',
    '£': '£',
    '¥': '¥'
  };

  const symbol = currencyMap[currency] || currency;
  
  // Format the number with appropriate decimal places
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  });

  return `${symbol}${formattedAmount}`;
}

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD'];

export function getCurrencySymbol(currency: string): string {
  const currencyMap: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'CAD': 'C$',
    'AUD': 'A$'
  };
  
  return currencyMap[currency] || currency;
}

export function getUserPreferredCurrency(): string {
  // For now, return USD as default. This could be enhanced to read from user preferences
  return 'USD';
}

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  // Basic currency conversion - in a real app, this would use live exchange rates
  // For now, return the same amount
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  // Simple mock conversion rates (these should be fetched from a real API)
  const exchangeRates: Record<string, number> = {
    'USD': 1,
    'EUR': 0.85,
    'GBP': 0.73,
    'JPY': 110,
    'CNY': 6.5,
    'CAD': 1.25,
    'AUD': 1.35
  };
  
  const fromRate = exchangeRates[fromCurrency] || 1;
  const toRate = exchangeRates[toCurrency] || 1;
  
  return (amount / fromRate) * toRate;
}
