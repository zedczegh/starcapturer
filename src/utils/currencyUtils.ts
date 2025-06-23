
// Currency conversion rates (in a real app, these would come from an API)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.85,
  RMB: 7.2,
  CNY: 7.2, // Alternative code for RMB
};

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'RMB'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

export const getCurrencySymbol = (currency: string): string => {
  switch (currency.toUpperCase()) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'RMB':
    case 'CNY':
      return '¥';
    default:
      return '$';
  }
};

export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number => {
  const fromRate = EXCHANGE_RATES[fromCurrency.toUpperCase()] || 1;
  const toRate = EXCHANGE_RATES[toCurrency.toUpperCase()] || 1;
  
  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
};

export const formatCurrency = (
  amount: number,
  currency: string,
  showSymbol: boolean = true
): string => {
  const symbol = getCurrencySymbol(currency);
  const formatted = amount.toFixed(2);
  
  if (!showSymbol) return formatted;
  
  // For RMB/CNY, put symbol before number
  if (currency.toUpperCase() === 'RMB' || currency.toUpperCase() === 'CNY') {
    return `${symbol}${formatted}`;
  }
  
  return `${symbol}${formatted}`;
};

export const getUserPreferredCurrency = (): string => {
  // Get user's location-based currency (simplified logic)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  if (timezone.includes('Europe')) return 'EUR';
  if (timezone.includes('Asia/Shanghai') || timezone.includes('Asia/Beijing')) return 'RMB';
  
  return 'USD'; // Default
};
