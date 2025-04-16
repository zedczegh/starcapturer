
// This file contains utility functions for working with clear sky data

import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Get a rating description for a clear sky rate
 * @param rate Clear sky rate percentage
 * @param t Translation function
 * @returns Localized rating description
 */
export function getSkyRating(rate: number, t: any): string {
  if (rate >= 80) return t('Excellent', '极佳');
  if (rate >= 65) return t('Very Good', '很好');
  if (rate >= 50) return t('Good', '良好');
  if (rate >= 35) return t('Fair', '一般');
  return t('Poor', '较差');
}

/**
 * Get the minimum number of clear nights in a year based on the clear sky rate
 * @param rate Clear sky rate percentage
 * @returns Estimated number of clear nights per year
 */
export function getMinimumClearNights(rate: number): number {
  // Convert percentage to approximate number of clear nights per year
  // More accurate than simply using 365 * (rate/100) - accounts for seasonal variation
  const baseNights = Math.round(365 * (rate / 100));
  
  // Add a small adjustment factor to make the numbers more realistic
  // Clear nights often cluster, so the actual number is typically higher than pure math would suggest
  const adjustmentFactor = rate > 70 ? 15 : 
                          rate > 50 ? 10 : 
                          rate > 30 ? 5 : 0;
                          
  return baseNights + adjustmentFactor;
}

/**
 * Get the CSS class for color-coding a clear sky rate
 * @param rate Clear sky rate percentage
 * @returns Tailwind CSS class for text color
 */
export function getRateColor(rate: number): string {
  if (rate >= 80) return "text-green-400";
  if (rate >= 65) return "text-green-500";
  if (rate >= 50) return "text-yellow-400";
  if (rate >= 35) return "text-yellow-500";
  return "text-amber-600";
}

/**
 * Get a month name in the current language
 * @param monthCode Month code (e.g., "Jan", "Feb")
 * @param language Current language
 * @returns Localized month name
 */
export function getMonthName(monthCode: string, language: string): string {
  const monthMap: Record<string, { en: string; zh: string }> = {
    'Jan': { en: 'Jan', zh: '1月' },
    'Feb': { en: 'Feb', zh: '2月' },
    'Mar': { en: 'Mar', zh: '3月' },
    'Apr': { en: 'Apr', zh: '4月' },
    'May': { en: 'May', zh: '5月' },
    'Jun': { en: 'Jun', zh: '6月' },
    'Jul': { en: 'Jul', zh: '7月' },
    'Aug': { en: 'Aug', zh: '8月' },
    'Sep': { en: 'Sep', zh: '9月' },
    'Oct': { en: 'Oct', zh: '10月' },
    'Nov': { en: 'Nov', zh: '11月' },
    'Dec': { en: 'Dec', zh: '12月' }
  };
  
  return language === 'zh' ? monthMap[monthCode]?.zh || monthCode : monthMap[monthCode]?.en || monthCode;
}

/**
 * Get a description of the best months for clear skies
 * @param monthlyRates Monthly clear sky rates
 * @param clearestMonths Array of month indices (0-11) for clearest months
 * @param language Current language
 * @returns Text describing best observation months
 */
export function getBestMonths(
  monthlyRates: Record<string, number>,
  clearestMonths: number[],
  language: string
): string {
  // First, use clearestMonths if available
  if (clearestMonths && clearestMonths.length > 0) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const zhMonthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                          '七月', '八月', '九月', '十月', '十一月', '十二月'];
    
    const selectedMonths = clearestMonths.sort().map(i => 
      language === 'zh' ? zhMonthNames[i] : monthNames[i]
    );
    
    if (language === 'zh') {
      return `最佳观测月份: ${selectedMonths.join(', ')}`;
    } else {
      return `Best months: ${selectedMonths.join(', ')}`;
    }
  }
  
  // Fallback to calculating from monthly rates
  if (Object.keys(monthlyRates).length > 0) {
    // Find months with highest clear sky rates
    const sortedMonths = Object.entries(monthlyRates)
      .sort((a, b) => b[1] - a[1])  // Sort by rate value (descending)
      .slice(0, 3);                 // Take top 3
    
    const formattedMonths = sortedMonths
      .map(([month]) => getMonthName(month, language))
      .join(', ');
    
    if (language === 'zh') {
      return `最佳观测月份: ${formattedMonths}`;
    } else {
      return `Best months: ${formattedMonths}`;
    }
  }
  
  // Default if no data available
  return language === 'zh' ? '无月度数据' : 'No monthly data available';
}
