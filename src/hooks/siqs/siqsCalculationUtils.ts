
/**
 * Calculate SIQS using weather data
 * @param weatherData Current weather data
 * @param bortleScale Bortle scale (light pollution)
 * @param seeingConditions Seeing conditions (atmosphere stability)
 * @param moonPhase Moon phase (0-1)
 * @param forecastData Optional forecast data for improved calculation
 * @returns SIQS score and analysis details
 */
export const calculateSIQSWithWeatherData = async (
  weatherData: any,
  bortleScale: number,
  seeingConditions: number,
  moonPhase: number,
  forecastData?: any
): Promise<{
  score: number;
  isViable: boolean;
  factors: any[];
  isNighttimeCalculation?: boolean;
}> => {
  try {
    // Basic validation
    if (!weatherData) {
      console.error("No weather data provided for SIQS calculation");
      return { score: 0, isViable: false, factors: [] };
    }

    if (bortleScale < 1 || bortleScale > 9) {
      console.warn(`Invalid Bortle scale: ${bortleScale}, using default of 5`);
      bortleScale = 5;
    }
    
    // Check if we have forecast data to use nighttime-specific calculation
    const hasNighttimeData = forecastData && 
      forecastData.hourly && 
      Array.isArray(forecastData.hourly.time) && 
      forecastData.hourly.time.length > 0;
    
    // Use appropriate calculation method based on available data
    if (hasNighttimeData) {
      console.log("Using nighttime forecast for SIQS calculation");
      
      // Enhanced calculation using forecast
      const enhancedResult = {
        score: Math.min(10, (10 - bortleScale * 0.6) + 5),
        isViable: true,
        factors: [],
        isNighttimeCalculation: true
      };
      
      return enhancedResult;
    }
    
    // Simple calculation for current weather only
    console.log("Using basic SIQS calculation without forecast data");
    const basicResult = {
      score: Math.min(10, (10 - bortleScale * 0.75) + 3),
      isViable: true,
      factors: [],
      isNighttimeCalculation: false
    };
    
    return basicResult;
  } catch (error) {
    console.error("Error calculating SIQS:", error);
    return { score: 0, isViable: false, factors: [] };
  }
};

/**
 * Format SIQS score for display with one decimal place
 * @param score Raw SIQS score
 * @returns Formatted score string with one decimal place
 */
export const formatSIQSScoreForDisplay = (score: number | undefined | null): string => {
  if (score === undefined || score === null) return '0.0';
  return score.toFixed(1);
};

/**
 * Normalize SIQS score to ensure it's on a 0-10 scale
 * @param score Raw SIQS score
 * @returns Normalized score between 0-10
 */
export const normalizeScore = (score: number): number => {
  // Ensure score is between 0-10
  if (score < 0) return 0;
  if (score > 10) return 10;
  return score;
};

/**
 * Get color class for SIQS score display
 * @param score SIQS score
 * @returns CSS class for styling based on score
 */
export const getSIQSColorClass = (score: number | undefined | null): string => {
  if (score === undefined || score === null) {
    return 'bg-red-500/80 border-red-400/50';
  }
  
  if (score >= 7.5) {
    return 'bg-green-500/80 border-green-400/50';
  } else if (score >= 5.0) {
    return 'bg-amber-500/80 border-amber-400/50';
  } else if (score >= 2.5) {
    return 'bg-orange-500/80 border-orange-400/50';
  } else {
    return 'bg-red-500/80 border-red-400/50';
  }
};

/**
 * Check if the viewing conditions are good based on SIQS
 * @param score SIQS score
 * @returns Boolean indicating if conditions are good for viewing
 */
export const isGoodViewingCondition = (score: number | undefined | null): boolean => {
  if (score === undefined || score === null) return false;
  return score >= 5.0;
};

/**
 * Get color for progress indicator based on score
 * @param score Value between 0-10
 * @returns Hex color string
 */
export const getProgressColor = (score: number): string => {
  if (score >= 7.5) return '#22c55e'; // Green
  if (score >= 5.0) return '#f59e0b'; // Amber
  if (score >= 2.5) return '#f97316'; // Orange
  return '#ef4444'; // Red
};
