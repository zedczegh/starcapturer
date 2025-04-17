/**
 * Clear sky rate utility functions with performance optimizations
 */

// Cache for expensive calculations
const clearSkyCalculationCache = new Map<string, {
  result: any;
  timestamp: number;
  validFor: number;
}>();

/**
 * Get month name based on number and language
 * @param month Month number (1-12)
 * @param language Language code ('en' or 'zh')
 * @returns Month name in the specified language
 */
export function getMonthName(month: number, language: string = 'en'): string {
  const cacheKey = `month_${month}_${language}`;
  
  // Check cache
  const cached = clearSkyCalculationCache.get(cacheKey);
  if (cached) {
    return cached.result;
  }
  
  let result: string;
  
  if (language === 'zh') {
    const chineseMonths = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    result = chineseMonths[month - 1];
  } else {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    result = months[month - 1];
  }
  
  // Cache result indefinitely (month names don't change)
  clearSkyCalculationCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
    validFor: Infinity
  });
  
  return result;
}

/**
 * Get color based on clear sky rate
 * @param rate Clear sky rate percentage
 * @returns CSS color class
 */
export function getRateColor(rate: number): string {
  const cacheKey = `rate_color_${Math.round(rate)}`;
  
  // Check cache
  const cached = clearSkyCalculationCache.get(cacheKey);
  if (cached) {
    return cached.result;
  }
  
  let result: string;
  
  if (rate >= 80) result = 'text-green-500';
  else if (rate >= 60) result = 'text-emerald-400';
  else if (rate >= 40) result = 'text-yellow-400';
  else if (rate >= 20) result = 'text-amber-500';
  else result = 'text-red-500';
  
  // Cache result indefinitely (color assignments don't change)
  clearSkyCalculationCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
    validFor: Infinity
  });
  
  return result;
}

/**
 * Get human-readable rating for clear sky rate
 * @param rate Clear sky rate percentage
 * @param t Translation function
 * @returns Human-readable rating
 */
export function getSkyRating(rate: number, t: (en: string, zh: string) => string): string {
  const cacheKey = `sky_rating_${Math.round(rate)}`;
  
  // Check cache (without translation)
  const cached = clearSkyCalculationCache.get(cacheKey);
  if (cached) {
    const { en, zh } = cached.result;
    return t(en, zh);
  }
  
  let en: string;
  let zh: string;
  
  if (rate >= 80) {
    en = "Excellent";
    zh = "极佳";
  } else if (rate >= 60) {
    en = "Good";
    zh = "良好";
  } else if (rate >= 40) {
    en = "Average";
    zh = "一般";
  } else if (rate >= 20) {
    en = "Poor";
    zh = "较差";
  } else {
    en = "Very Poor";
    zh = "很差";
  }
  
  // Cache result indefinitely (rating thresholds don't change)
  clearSkyCalculationCache.set(cacheKey, {
    result: { en, zh },
    timestamp: Date.now(),
    validFor: Infinity
  });
  
  return t(en, zh);
}

/**
 * Calculate minimum number of clear nights per year
 * @param clearSkyRate Annual clear sky rate percentage
 * @param latitude Location latitude (optional, for seasonal adjustments)
 * @returns Estimated number of clear nights
 */
export function getMinimumClearNights(clearSkyRate: number, latitude?: number): number {
  const cacheKey = `clear_nights_${Math.round(clearSkyRate)}_${latitude ? Math.round(latitude) : 'null'}`;
  
  // Check cache
  const cached = clearSkyCalculationCache.get(cacheKey);
  if (cached) {
    return cached.result;
  }
  
  // Base calculation - assuming 365 nights per year
  let clearNights = Math.round((clearSkyRate / 100) * 365);
  
  // Apply seasonal adjustments based on latitude if provided
  if (latitude !== undefined) {
    // For extreme latitudes (polar regions), adjust for polar day/night
    if (Math.abs(latitude) > 65) {
      // Fewer available nights in polar regions
      clearNights = Math.round(clearNights * 0.7);
    } 
    // For mid-latitudes, slight adjustment for seasonal variation
    else if (Math.abs(latitude) > 45) {
      clearNights = Math.round(clearNights * 0.9);
    }
  }
  
  // Cache result with a month validity
  clearSkyCalculationCache.set(cacheKey, {
    result: clearNights,
    timestamp: Date.now(),
    validFor: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
  
  return clearNights;
}

/**
 * Get best months for observation based on monthly rates
 * @param monthlyRates Monthly clear sky rates
 * @param clearestMonths Array of clearest months
 * @param language Language code ('en' or 'zh')
 * @param latitude Optional latitude for hemisphere-specific text
 * @returns Formatted text describing best months
 */
export function getBestMonths(
  monthlyRates: Record<string, number>,
  clearestMonths: string[],
  language: string,
  latitude?: number
): string {
  const cacheKey = `best_months_${JSON.stringify(monthlyRates)}_${clearestMonths.join(',')}_${language}_${latitude || 0}`;
  
  // Check cache
  const cached = clearSkyCalculationCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < cached.validFor)) {
    return cached.result;
  }
  
  let result: string;
  
  // If we have monthly rates, use them to determine best months
  if (Object.keys(monthlyRates).length > 0) {
    // Find months with highest rates
    const sortedMonths = Object.entries(monthlyRates)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([month]) => getMonthName(parseInt(month), language));
    
    if (language === 'zh') {
      result = `最佳观测月份: ${sortedMonths.join('、')}`;
    } else {
      result = `Best months: ${sortedMonths.join(', ')}`;
    }
  } 
  // Otherwise use provided clearest months if available
  else if (clearestMonths.length > 0) {
    // Convert month names if needed
    const formattedMonths = clearestMonths.map(month => {
      const monthNum = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
        .findIndex(m => month.toLowerCase().includes(m));
      
      if (monthNum >= 0 && language === 'zh') {
        return getMonthName(monthNum + 1, 'zh');
      }
      return month;
    });
    
    if (language === 'zh') {
      result = `最佳观测月份: ${formattedMonths.join('、')}`;
    } else {
      result = `Best months: ${formattedMonths.join(', ')}`;
    }
  } 
  // Default to seasonal pattern based on hemisphere
  else {
    const isNorthern = latitude === undefined || latitude >= 0;
    
    if (language === 'zh') {
      result = isNorthern ? 
        '北半球一般冬季晴空率高于夏季' : 
        '南半球一般夏季晴空率高于冬季';
    } else {
      result = isNorthern ? 
        'Northern hemisphere typically has clearer skies in winter than summer' : 
        'Southern hemisphere typically has clearer skies in summer than winter';
    }
  }
  
  // Cache result for a day
  clearSkyCalculationCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
    validFor: 24 * 60 * 60 * 1000 // 1 day
  });
  
  return result;
}

/**
 * Clear caches to free memory
 */
export function clearCaches(): void {
  clearSkyCalculationCache.clear();
}
