
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Get the rating description for a given clear sky percentage
 * Enhanced with more accurate thresholds for star visibility
 */
export const getSkyRating = (percentage: number, t: Function): string => {
  // Updated thresholds based on astronomical viewing criteria
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
 * Enhanced with more accurate formula based on historical data
 */
export const getMinimumClearNights = (annualRate: number): number => {
  // More accurate formula for predicting clear nights suitable for stargazing
  // Clear nights require not just no rain but low cloud cover, good seeing conditions, etc.
  // Apply a stricter threshold to account for visibility requirements
  const baseNights = Math.round((annualRate / 100) * 365);
  
  // Visibility adjustment factor - nights need to be truly clear for stargazing
  const visibilityFactor = 0.7; // Only ~70% of technically "clear" nights are good for stargazing
  
  const adjustedNights = Math.round(baseNights * visibilityFactor);
  
  // Return maximum of adjusted calculation or 30 nights (minimum reasonable value)
  return Math.max(30, adjustedNights);
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

/**
 * Calculate star visibility score based on multiple factors
 * This provides a more accurate representation of whether stars will be visible
 */
export const calculateStarVisibility = (
  clearSkyRate: number,
  humidity: number = 60,
  airQuality: number = 50,
  lightPollution: number = 5
): number => {
  // Base score starts with clear sky rate
  let visibilityScore = clearSkyRate;
  
  // High humidity reduces visibility (even on clear nights)
  if (humidity > 70) {
    const humidityPenalty = (humidity - 70) * 0.5;
    visibilityScore -= humidityPenalty;
  }
  
  // Air quality affects visibility (particulates scatter light)
  if (airQuality > 50) {
    const aqiPenalty = (airQuality - 50) * 0.2;
    visibilityScore -= aqiPenalty;
  }
  
  // Light pollution has major impact on star visibility
  // Bortle scale 1-9, where 9 is highest light pollution
  const lightPollutionPenalty = (lightPollution - 1) * 5;
  visibilityScore -= lightPollutionPenalty;
  
  // Ensure result is within valid range
  return Math.max(10, Math.min(100, visibilityScore));
};

/**
 * Enhanced function to adjust clear sky percentage based on historical data
 * This more accurately reflects nights when stars are actually visible
 */
export const adjustClearSkyForStarVisibility = (
  basePercentage: number,
  location: { latitude: number, longitude: number },
  historicalPatterns: any = null
): number => {
  // Start with base percentage
  let adjustedPercentage = basePercentage;
  
  // Latitude-based adjustments
  const absLat = Math.abs(location.latitude);
  
  // Adjust for latitude effects on atmospheric seeing
  // Mid-latitudes typically have better seeing conditions
  if (absLat > 20 && absLat < 50) {
    adjustedPercentage += 5; // Slightly better conditions in mid-latitudes
  } else if (absLat > 60) {
    adjustedPercentage -= 8; // Polar regions often have atmospheric phenomena
  }
  
  // If we have historical patterns data, use it to refine our estimate
  if (historicalPatterns) {
    // Apply seasonal adjustments if available
    if (historicalPatterns.seasonalTrends) {
      // Current season
      const now = new Date();
      const month = now.getMonth();
      let currentSeason: string;
      
      // Northern hemisphere seasons
      if (location.latitude >= 0) {
        if (month >= 2 && month <= 4) currentSeason = 'spring';
        else if (month >= 5 && month <= 7) currentSeason = 'summer';
        else if (month >= 8 && month <= 10) currentSeason = 'fall';
        else currentSeason = 'winter';
      } 
      // Southern hemisphere (opposite seasons)
      else {
        if (month >= 2 && month <= 4) currentSeason = 'fall';
        else if (month >= 5 && month <= 7) currentSeason = 'winter';
        else if (month >= 8 && month <= 10) currentSeason = 'spring';
        else currentSeason = 'summer';
      }
      
      // Apply seasonal adjustment if we have data for that season
      if (historicalPatterns.seasonalTrends[currentSeason]) {
        const seasonalRate = historicalPatterns.seasonalTrends[currentSeason].clearSkyRate;
        
        // Weight the seasonal influence (60% seasonal, 40% annual baseline)
        adjustedPercentage = adjustedPercentage * 0.4 + seasonalRate * 0.6;
      }
    }
    
    // Apply visibility adjustments
    if (historicalPatterns.visibility) {
      switch (historicalPatterns.visibility) {
        case 'excellent':
          adjustedPercentage += 10;
          break;
        case 'good':
          adjustedPercentage += 5;
          break;
        case 'poor':
          adjustedPercentage -= 15;
          break;
        default: // 'average'
          // No adjustment needed
          break;
      }
    }
    
    // Factor in historical precipitation data
    if (historicalPatterns.annualPrecipitationDays) {
      const precipDays = historicalPatterns.annualPrecipitationDays;
      // More precipitation days generally means worse sky quality
      const precipFactor = Math.min(15, Math.max(-15, (100 - precipDays / 1.5) / 10));
      adjustedPercentage += precipFactor;
    }
  }
  
  // Cap at realistic bounds
  return Math.max(15, Math.min(95, adjustedPercentage));
};
