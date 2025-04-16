
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Get the rating description for a given clear sky percentage
 */
export const getSkyRating = (percentage: number, t: Function): string => {
  if (percentage >= 75) return t('Excellent', '极好');
  if (percentage >= 60) return t('Very Good', '很好');
  if (percentage >= 45) return t('Good', '良好');
  if (percentage >= 30) return t('Fair', '一般');
  return t('Poor', '较差');
};

/**
 * Get the CSS color class for a given clear sky rate
 */
export const getRateColor = (rate: number): string => {
  if (rate >= 75) return 'text-green-400';
  if (rate >= 60) return 'text-blue-400';
  if (rate >= 45) return 'text-yellow-400';
  if (rate >= 30) return 'text-orange-400';
  return 'text-red-400';
};

/**
 * Calculate the minimum number of clear nights per year
 * to ensure we always display a reasonable value
 */
export const getMinimumClearNights = (annualRate: number): number => {
  // Ensure we always have a reasonable number of clear nights
  return Math.max(30, Math.round((annualRate / 100) * 365)); // Minimum 30 nights
};

/**
 * Get best months for observation based on monthly rates
 */
export const getBestMonths = (monthlyRates: Record<string, number> = {}, clearestMonths: string[] = [], language: string): string => {
  if (clearestMonths && clearestMonths.length > 0) {
    return language === 'en'
      ? `Best months: ${clearestMonths.join(', ')}`
      : `最佳月份: ${clearestMonths.join(', ')}`;
  }
  
  if (!monthlyRates || Object.keys(monthlyRates).length === 0) return '';
  
  const sortedMonths = Object.entries(monthlyRates)
    .sort(([, rateA], [, rateB]) => Number(rateB) - Number(rateA))
    .slice(0, 3)
    .map(([month]) => month);
  
  return language === 'en' 
    ? `Best months: ${sortedMonths.join(', ')}`
    : `最佳月份: ${sortedMonths.join(', ')}`;
};

/**
 * Convert month key to localized month name
 */
export const getMonthName = (monthKey: string, language: string): string => {
  const monthMap: Record<string, [string, string]> = {
    'Jan': ['January', '一月'],
    'Feb': ['February', '二月'],
    'Mar': ['March', '三月'],
    'Apr': ['April', '四月'],
    'May': ['May', '五月'],
    'Jun': ['June', '六月'],
    'Jul': ['July', '七月'],
    'Aug': ['August', '八月'],
    'Sep': ['September', '九月'],
    'Oct': ['October', '十月'],
    'Nov': ['November', '十一月'],
    'Dec': ['December', '十二月']
  };
  
  return language === 'en' ? monthMap[monthKey][0] : monthMap[monthKey][1];
};
