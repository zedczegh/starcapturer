
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
