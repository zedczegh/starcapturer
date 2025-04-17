
/**
 * Clear sky utilities with enhanced accuracy for all regions globally
 */

// Map language to month names for localization
const MONTH_NAMES: Record<string, Record<string, string>> = {
  en: {
    '1': 'Jan', '2': 'Feb', '3': 'Mar', '4': 'Apr', '5': 'May', '6': 'Jun',
    '7': 'Jul', '8': 'Aug', '9': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
  },
  zh: {
    '1': '一月', '2': '二月', '3': '三月', '4': '四月', '5': '五月', '6': '六月',
    '7': '七月', '8': '八月', '9': '九月', '10': '十月', '11': '十一月', '12': '十二月'
  }
};

/**
 * Get month name based on language
 * @param month Month number (1-12) or string
 * @param language Current language code
 * @returns Localized month name
 */
export const getMonthName = (month: string | number, language: string = 'en'): string => {
  // Convert month to string key if it's a number
  const monthKey = typeof month === 'number' ? month.toString() : month;
  
  // Use English as fallback if language not available
  const languageMonths = MONTH_NAMES[language] || MONTH_NAMES.en;
  
  return languageMonths[monthKey] || monthKey;
};

/**
 * Get text color class based on clear sky rate
 * @param rate Clear sky rate percentage
 * @returns Tailwind color class
 */
export const getRateColor = (rate: number): string => {
  if (rate >= 75) return 'text-green-500';
  if (rate >= 60) return 'text-green-400';
  if (rate >= 45) return 'text-yellow-400';
  if (rate >= 30) return 'text-yellow-500';
  if (rate >= 15) return 'text-orange-500';
  return 'text-red-500';
};

/**
 * Get sky quality rating based on clear sky rate
 * @param rate Clear sky rate percentage
 * @param t Translation function
 * @returns Localized sky quality description
 */
export const getSkyRating = (rate: number, t: any): string => {
  if (rate >= 75) return t('Excellent', '极佳');
  if (rate >= 60) return t('Very Good', '很好');
  if (rate >= 45) return t('Good', '良好');
  if (rate >= 30) return t('Fair', '一般');
  if (rate >= 15) return t('Poor', '较差');
  return t('Very Poor', '很差');
};

/**
 * Calculate minimum clear nights per year based on clear sky rate
 * Enhanced to be more accurate globally (accounts for climate zones and regional patterns)
 * @param rate Clear sky rate percentage 
 * @param latitude Location latitude for climate zone adjustments
 * @param longitude Location longitude for regional climate patterns
 * @returns Estimated number of clear nights per year
 */
export const getMinimumClearNights = (
  rate: number, 
  latitude?: number,
  longitude?: number
): number => {
  // Import the enhanced calculation from clearSkyRateUtils
  const { getMinimumClearNights } = require('../weather/clearSkyRateUtils');
  return getMinimumClearNights(rate, latitude, longitude);
};

/**
 * Find and format best months for observation from monthly rates or historical data
 * Enhanced to handle southern hemisphere seasonality correctly
 * @param monthlyRates Monthly clear sky rates
 * @param clearestMonths Array of clearest month codes from historical data
 * @param language Current language code
 * @param latitude Optional latitude to adjust for hemisphere
 * @returns Formatted string listing best months
 */
export const getBestMonths = (
  monthlyRates: Record<string, number>, 
  clearestMonths: string[], 
  language: string = 'en',
  latitude?: number
): string => {
  // Use latitude to determine hemisphere
  const isNorthernHemisphere = latitude === undefined || latitude >= 0;
  
  // Use predefined clearest months if available and not empty
  if (clearestMonths && clearestMonths.length > 0) {
    const translatedMonths = clearestMonths.map(month => {
      // Sometimes we get full month names, sometimes abbreviations
      if (month.length <= 3) {
        // Try to match abbreviation to month number
        const monthNum = Object.entries(MONTH_NAMES.en).find(([_, abbr]) => abbr === month)?.[0];
        return monthNum ? getMonthName(monthNum, language) : month;
      }
      return month; // Use as is if it's a full month name
    });
    
    // Seasonal ordering for display (different for different hemispheres)
    if (!isNorthernHemisphere) {
      // For southern hemisphere, sort months in opposite seasonal order
      const monthOrder: Record<string, number> = {
        'Dec': 0, 'Jan': 1, 'Feb': 2, // Summer
        'Mar': 3, 'Apr': 4, 'May': 5, // Fall
        'Jun': 6, 'Jul': 7, 'Aug': 8, // Winter
        'Sep': 9, 'Oct': 10, 'Nov': 11 // Spring
      };
      
      translatedMonths.sort((a, b) => {
        const aOrder = monthOrder[a] ?? 12;
        const bOrder = monthOrder[b] ?? 12;
        return aOrder - bOrder;
      });
    }
    
    return `${language === 'en' ? 'Best months: ' : '最佳月份: '}${translatedMonths.join(', ')}`;
  }
  
  // If no predefined months, calculate from monthly rates
  if (Object.keys(monthlyRates).length > 0) {
    // Sort months by rate (descending)
    const sortedMonths = Object.entries(monthlyRates)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // Get top 3
    
    // Only include months with good rates (>50%)
    const goodMonths = sortedMonths.filter(([_, rate]) => rate >= 50);
    
    if (goodMonths.length > 0) {
      const monthNames = goodMonths.map(([month]) => getMonthName(month, language));
      return `${language === 'en' ? 'Best months: ' : '最佳月份: '}${monthNames.join(', ')}`;
    }
  }
  
  // Fallback if no good data available - use typical seasons based on hemisphere
  return language === 'en' 
    ? `Typical best months: ${isNorthernHemisphere ? 'Jun-Aug' : 'Dec-Feb'}`
    : `典型最佳月份: ${isNorthernHemisphere ? '六月至八月' : '十二月至二月'}`;
};

/**
 * Estimate clear sky rate from historical weather data
 * @param precipitationDays Annual precipitation days
 * @param cloudCoverAvg Average cloud cover percentage
 * @param isDesert Whether the location is in a desert climate
 * @returns Estimated clear sky percentage
 */
export const estimateClearSkyRate = (
  precipitationDays: number, 
  cloudCoverAvg: number,
  isDesert: boolean = false
): number => {
  // Base calculation using precipitation days
  let clearSkyPercent = Math.max(0, 100 - (precipitationDays / 3.65));
  
  // Adjust by cloud cover - more weight to this factor
  clearSkyPercent = (clearSkyPercent * 0.4) + ((100 - cloudCoverAvg) * 0.6);
  
  // Desert climate adjustment - clearer nights even with daytime clouds
  if (isDesert) {
    clearSkyPercent = Math.min(100, clearSkyPercent * 1.15);
  }
  
  // Round and ensure reasonable bounds
  return Math.round(Math.max(10, Math.min(clearSkyPercent, 95)));
};

/**
 * Calculate seasonal clear sky variations based on latitude and climate
 * @param latitude Location latitude
 * @param baseRate Annual average clear sky rate
 * @returns Record with seasonal rates
 */
export const calculateSeasonalRates = (
  latitude: number, 
  baseRate: number
): Record<string, number> => {
  const absLat = Math.abs(latitude);
  const isNorthern = latitude >= 0;
  
  // Default variation factors (percentage points +/-)
  let winterVariation = 0;
  let summerVariation = 0;
  
  // Calculate seasonal variations based on latitude
  if (absLat < 15) {
    // Tropical - wet/dry seasons dominate
    winterVariation = -15; // Wet season typically has lower clear sky rates
    summerVariation = 15;  // Dry season typically has higher clear sky rates
  } else if (absLat < 35) {
    // Subtropical - moderate variations
    winterVariation = isNorthern ? -10 : 10;
    summerVariation = isNorthern ? 10 : -10;
  } else if (absLat < 60) {
    // Temperate - stronger variations
    winterVariation = isNorthern ? -20 : 15;
    summerVariation = isNorthern ? 15 : -15;
  } else {
    // Polar - extreme variations
    winterVariation = isNorthern ? -25 : 20;
    summerVariation = isNorthern ? 20 : -20;
  }
  
  // Make sure we don't go out of bounds with our variations
  const winterRate = Math.max(5, Math.min(95, baseRate + winterVariation));
  const summerRate = Math.max(5, Math.min(95, baseRate + summerVariation));
  
  // Interpolate spring and fall
  const springRate = Math.round((winterRate + summerRate) / 2 + (isNorthern ? 5 : -5));
  const fallRate = Math.round((winterRate + summerRate) / 2 + (isNorthern ? -5 : 5));
  
  return {
    winter: Math.round(winterRate),
    spring: Math.round(springRate),
    summer: Math.round(summerRate),
    fall: Math.round(fallRate)
  };
};
