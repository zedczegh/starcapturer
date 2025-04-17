
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
 * Enhanced to provide more accurate estimates based on location and climate data
 * @param clearSkyRate Annual clear sky rate percentage
 * @param latitude Location latitude for seasonal adjustments
 * @param longitude Location longitude for regional climate patterns
 * @returns Estimated number of clear nights
 */
export function getMinimumClearNights(
  clearSkyRate: number, 
  latitude?: number,
  longitude?: number
): number {
  const cacheKey = `clear_nights_${Math.round(clearSkyRate)}_${latitude ? Math.round(latitude) : 'null'}_${longitude ? Math.round(longitude) : 'null'}`;
  
  // Check cache
  const cached = clearSkyCalculationCache.get(cacheKey);
  if (cached) {
    return cached.result;
  }
  
  // Base calculation - starting point from clear sky rate
  let baseNights = Math.round((clearSkyRate / 100) * 365);
  
  // Apply adjustments based on region and climate patterns
  let clearNights = baseNights;
  
  if (latitude !== undefined && longitude !== undefined) {
    // Apply region-specific adjustments
    
    // Guizhou province (China) adjustment - known for more overcast days 
    // Approximate coordinates: latitude 24.5-29, longitude 104-109.5
    if (latitude >= 24.5 && latitude <= 29 && longitude >= 104 && longitude <= 109.5) {
      // Adjust for Guizhou's karst topography and subtropical monsoon climate
      // This region has high humidity and frequent fog/mist, reducing clear nights
      clearNights = Math.round(baseNights * 0.75);
    }
    // Southern China adjustment (generally more rainfall/humidity)
    else if (latitude > 20 && latitude < 35 && longitude > 100 && longitude < 120) {
      clearNights = Math.round(baseNights * 0.85);
    }
    // Desert regions adjustment (typically more clear nights)
    else if (isDesertRegion(latitude, longitude)) {
      clearNights = Math.round(baseNights * 1.15);
    }
    // Tropical rainforest regions (high precipitation)
    else if (isTropicalRainforestRegion(latitude, longitude)) {
      clearNights = Math.round(baseNights * 0.8);
    }
    // Mediterranean climate regions (dry summers, wet winters)
    else if (isMediterraneanRegion(latitude, longitude)) {
      // These regions have very seasonal clear nights
      clearNights = Math.round(baseNights * 1.05);
    }
    // Polar/sub-polar regions
    else if (Math.abs(latitude) > 60) {
      // Fewer observable nights in polar regions due to extended daylight periods
      const polarAdjustment = 1 - (Math.abs(latitude) - 60) / 60;
      clearNights = Math.round(baseNights * polarAdjustment);
    }
  }
  
  // Further latitude-based seasonal adjustments
  if (latitude !== undefined) {
    const absLat = Math.abs(latitude);
    
    // Mid-latitude regions have more seasonal variations
    if (absLat > 30 && absLat < 60) {
      // Adjust for stronger seasonal effects in mid-latitudes
      clearNights = Math.round(clearNights * 0.95);
    }
  }
  
  // Ensure the result is within reasonable bounds
  clearNights = Math.max(30, Math.min(clearNights, 330)); 
  
  // Cache result with a month validity
  clearSkyCalculationCache.set(cacheKey, {
    result: clearNights,
    timestamp: Date.now(),
    validFor: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
  
  return clearNights;
}

/**
 * Determine if coordinates are in a desert region
 */
function isDesertRegion(latitude: number, longitude: number): boolean {
  // Major desert regions of the world
  
  // Sahara Desert
  if (latitude >= 15 && latitude <= 35 && longitude >= -15 && longitude <= 35) {
    return true;
  }
  
  // Arabian Desert
  if (latitude >= 15 && latitude <= 30 && longitude >= 35 && longitude <= 60) {
    return true;
  }
  
  // Gobi Desert
  if (latitude >= 40 && latitude <= 45 && longitude >= 90 && longitude <= 120) {
    return true;
  }
  
  // Australian Deserts
  if (latitude <= -20 && latitude >= -30 && longitude >= 120 && longitude <= 140) {
    return true;
  }
  
  // Southwestern US Deserts
  if (latitude >= 30 && latitude <= 40 && longitude >= -120 && longitude <= -100) {
    return true;
  }
  
  // Atacama Desert
  if (latitude >= -30 && latitude <= -20 && longitude >= -72 && longitude <= -68) {
    return true;
  }
  
  return false;
}

/**
 * Determine if coordinates are in a tropical rainforest region
 */
function isTropicalRainforestRegion(latitude: number, longitude: number): boolean {
  // Must be in tropical latitudes
  if (Math.abs(latitude) > 23.5) {
    return false;
  }
  
  // Amazon Rainforest
  if (latitude >= -20 && latitude <= 5 && longitude >= -75 && longitude <= -45) {
    return true;
  }
  
  // Congo Rainforest
  if (latitude >= -5 && latitude <= 5 && longitude >= 10 && longitude <= 30) {
    return true;
  }
  
  // Southeast Asian Rainforests
  if (latitude >= -10 && latitude <= 10 && longitude >= 95 && longitude <= 150) {
    return true;
  }
  
  return false;
}

/**
 * Determine if coordinates are in a Mediterranean climate region
 */
function isMediterraneanRegion(latitude: number, longitude: number): boolean {
  // Mediterranean Basin
  if (latitude >= 30 && latitude <= 45 && longitude >= -10 && longitude <= 40) {
    return true;
  }
  
  // California
  if (latitude >= 32 && latitude <= 42 && longitude >= -124 && longitude <= -115) {
    return true;
  }
  
  // Chile
  if (latitude >= -40 && latitude <= -30 && longitude >= -75 && longitude <= -70) {
    return true;
  }
  
  // Cape Town region
  if (latitude >= -35 && latitude <= -30 && longitude >= 15 && longitude <= 25) {
    return true;
  }
  
  // Southwest and South Australia
  if (latitude >= -38 && latitude <= -32 && longitude >= 115 && longitude <= 140) {
    return true;
  }
  
  return false;
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
