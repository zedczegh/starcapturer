
/**
 * Get regional pattern information for a specific location
 */
function getRegionalPattern(latitude?: number, longitude?: number, language: string = 'en'): string | null {
  if (!latitude || !longitude) return null;
  
  // Check for special regions with unique patterns
  
  // Tibetan plateau
  if (latitude >= 28 && latitude <= 36 && longitude >= 78 && longitude <= 92) {
    return language === 'zh' ? 
      '高原地区: 春季风沙多，秋冬晴朗日多，观测条件极佳' : 
      'Plateau region: Dusty in spring, clear days in autumn/winter, excellent viewing conditions';
  }
  
  // Tropical monsoon regions
  if (isTropicalMonsoonRegion(latitude, longitude)) {
    return language === 'zh' ? 
      '季风地区: 干季(冬春)观测条件较好，雨季(夏秋)多阴雨' : 
      'Monsoon region: Dry season (winter/spring) offers better viewing than wet season (summer/fall)';
  }
  
  // Mediterranean climate
  if (isMediterraneanRegion(latitude, longitude)) {
    return language === 'zh' ? 
      '地中海气候: 夏季晴朗干燥，冬季多雨' : 
      'Mediterranean climate: Clear, dry summers with rainy winters';
  }
  
  // Desert regions
  if (isDesertRegion(latitude, longitude)) {
    return language === 'zh' ? 
      '沙漠地区: 全年晴朗日多，但春季尘暴可能影响观测' : 
      'Desert region: Year-round clear skies, but spring dust storms may affect viewing';
  }
  
  return null;
}

/**
 * Determine if a location is in a tropical monsoon region
 */
function isTropicalMonsoonRegion(latitude: number, longitude: number): boolean {
  // Southeast Asia monsoon region
  if (latitude >= 5 && latitude <= 25 && longitude >= 95 && longitude <= 125) {
    return true;
  }
  
  // Indian monsoon region
  if (latitude >= 8 && latitude <= 28 && longitude >= 70 && longitude <= 95) {
    return true;
  }
  
  // Parts of Central America and southern Mexico
  if (latitude >= 10 && latitude <= 20 && longitude >= -105 && longitude <= -85) {
    return true;
  }
  
  // Northern Australia monsoon region
  if (latitude <= -10 && latitude >= -20 && longitude >= 125 && longitude <= 145) {
    return true;
  }
  
  return false;
}

/**
 * Determine if a location has Mediterranean climate
 */
function isMediterraneanRegion(latitude: number, longitude: number): boolean {
  // Mediterranean basin
  if (latitude >= 30 && latitude <= 45 && longitude >= -5 && longitude <= 40) {
    return true;
  }
  
  // California coast
  if (latitude >= 32 && latitude <= 42 && longitude >= -124 && longitude <= -115) {
    return true;
  }
  
  // Central Chile
  if (latitude <= -30 && latitude >= -37 && longitude >= -72 && longitude <= -70) {
    return true;
  }
  
  // Southern Australia
  if (latitude <= -32 && latitude >= -38 && longitude >= 115 && longitude <= 145) {
    return true;
  }
  
  // Western Cape of South Africa
  if (latitude <= -30 && latitude >= -35 && longitude >= 17 && longitude <= 25) {
    return true;
  }
  
  return false;
}

/**
 * Determine if a location is in a desert region
 */
function isDesertRegion(latitude: number, longitude: number): boolean {
  // Sahara Desert
  if (latitude >= 15 && latitude <= 30 && longitude >= -15 && longitude <= 35) {
    return true;
  }
  
  // Arabian Desert
  if (latitude >= 15 && latitude <= 30 && longitude >= 35 && longitude <= 60) {
    return true;
  }
  
  // Gobi and Taklamakan Deserts
  if (latitude >= 35 && latitude <= 45 && longitude >= 75 && longitude <= 110) {
    return true;
  }
  
  // Atacama Desert
  if (latitude <= -15 && latitude >= -30 && longitude >= -72 && longitude <= -68) {
    return true;
  }
  
  // North American deserts (Mojave, Sonoran, etc.)
  if (latitude >= 25 && latitude <= 42 && longitude >= -120 && longitude <= -105) {
    return true;
  }
  
  // Australian deserts
  if (latitude <= -20 && latitude >= -32 && longitude >= 115 && longitude <= 140) {
    return true;
  }
  
  return false;
}

/**
 * Get color based on clear sky rate
 * @param rate Clear sky rate as a percentage
 * @returns Color class for styling
 */
export function getRateColor(rate: number): string {
  if (!isFinite(rate) || rate < 0) return "text-gray-400"; // Added safety check
  if (rate >= 75) return "text-green-500";
  if (rate >= 60) return "text-emerald-400";
  if (rate >= 45) return "text-yellow-400";
  if (rate >= 30) return "text-amber-500";
  if (rate >= 15) return "text-orange-500";
  return "text-red-500";
}

/**
 * Calculate the minimum number of clear nights per year based on clear sky rate and location
 * Includes adjustments for location-specific factors
 * @param clearSkyRate Clear sky rate percentage
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Estimated number of clear nights per year
 */
export function getMinimumClearNights(
  clearSkyRate: number, 
  latitude: number, 
  longitude: number
): number {
  // Safety check for invalid inputs
  if (!isFinite(clearSkyRate) || !isFinite(latitude) || !isFinite(longitude)) {
    console.warn("Invalid parameters for getMinimumClearNights:", { clearSkyRate, latitude, longitude });
    return 0;
  }
  
  // Base calculation: percentage of nights that are clear
  let baseNights = Math.round((clearSkyRate / 100) * 365 * 0.6);
  
  // Apply location-specific adjustments
  // Import from the historical patterns if available
  try {
    const { getHistoricalPattern } = require('../historicalPatterns');
    const pattern = getHistoricalPattern(latitude, longitude);
    
    if (pattern && pattern.annualClearNightCount) {
      // Use historical data if available
      return pattern.annualClearNightCount;
    }
    
    // Apply regional adjustments if available
    if (pattern && pattern.clearDaysRatio) {
      // Get current month (0-11)
      const month = new Date().getMonth();
      if (pattern.clearDaysRatio[month]) {
        baseNights = Math.round(baseNights * pattern.clearDaysRatio[month]);
      }
    }
  } catch (error) {
    console.error("Error applying historical patterns:", error);
    // Continue with base calculation
  }

  // Apply latitude-based adjustments (polar regions have fewer observable nights in summer)
  if (Math.abs(latitude) > 60) {
    // Reduce clear night count for polar regions
    baseNights = Math.round(baseNights * 0.8);
  }
  
  // Apply adjustments based on regional climate patterns
  if (isTropicalMonsoonRegion(latitude, longitude)) {
    // Monsoon regions have distinct wet and dry seasons
    baseNights = Math.round(baseNights * 0.9);
  } else if (isDesertRegion(latitude, longitude)) {
    // Desert regions generally have more clear nights
    baseNights = Math.round(baseNights * 1.2);
  } else if (isMediterraneanRegion(latitude, longitude)) {
    // Mediterranean regions have seasonal patterns
    baseNights = Math.round(baseNights * 1.1);
  }
  
  return Math.max(5, baseNights); // Ensure a minimum of 5 nights
}

/**
 * Get the best months for astronomical observation based on monthly clear sky rates
 * @param monthlyRates Monthly clear sky rates
 * @param clearestMonths Array of month abbreviations with best conditions
 * @param language User language preference
 * @param latitude Location latitude (used for hemisphere-specific adjustments)
 * @returns Formatted string with best months/seasons for observation
 */
export function getBestMonths(
  monthlyRates: Record<string, number> = {}, 
  clearestMonths: string[] = [],
  language: string = 'en',
  latitude: number = 0
): string {
  // Safety check for monthlyRates - ensure it's an object
  if (typeof monthlyRates !== 'object' || monthlyRates === null) {
    console.warn("Invalid monthlyRates provided to getBestMonths:", monthlyRates);
    monthlyRates = {};
  }
  
  // If clearestMonths is provided and not empty, use that
  if (Array.isArray(clearestMonths) && clearestMonths.length > 0) {
    const monthsText = clearestMonths.join(', ');
    return language === 'en' 
      ? `Best months: ${monthsText}` 
      : `最佳月份: ${monthsText}`;
  }
  
  // If monthly rates are provided, determine the best months
  if (Object.keys(monthlyRates).length > 0) {
    try {
      // Sort months by clear sky rate
      const sortedMonths = Object.entries(monthlyRates)
        .sort(([, rateA], [, rateB]) => rateB - rateA)
        .map(([month]) => month)
        .slice(0, 3);
        
      if (sortedMonths.length > 0) {
        const monthsText = sortedMonths.join(', ');
        return language === 'en' 
          ? `Best months: ${monthsText}` 
          : `最佳月份: ${monthsText}`;
      }
    } catch (error) {
      console.error("Error processing monthly rates:", error);
      // Fall through to default
    }
  }
  
  // Default to hemisphere-based seasonal recommendations
  const inNorthernHemisphere = latitude >= 0;
  
  if (inNorthernHemisphere) {
    return language === 'en' 
      ? 'Typically best: Oct-Mar (Northern Hemisphere)' 
      : '通常最佳: 十月至三月 (北半球)';
  } else {
    return language === 'en' 
      ? 'Typically best: Apr-Sep (Southern Hemisphere)' 
      : '通常最佳: 四月至九月 (南半球)';
  }
}

// Export the regional pattern function as well
export { getRegionalPattern };
