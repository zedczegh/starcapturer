
/**
 * Get the most consistent SIQS value from a location
 * Prioritizes different sources in order:
 * 1. siqsResult.score (most accurate, from nighttime calculation)
 * 2. siqs (direct value)
 * 3. 0 (fallback)
 * @param location Location object with potential SIQS data
 * @returns The most accurate SIQS value available
 */
export function getConsistentSiqsValue(location: any): number {
  if (!location) return 0;
  
  // Priority 1: Use siqsResult.score if available (most accurate)
  if (location.siqsResult && typeof location.siqsResult.score === 'number') {
    return location.siqsResult.score;
  }
  
  // Priority 2: Use direct siqs property
  if (typeof location.siqs === 'number') {
    return location.siqs;
  }
  
  // Fallback: return 0
  return 0;
}

/**
 * Check if this is a nighttime SIQS calculation
 * @param siqsResult SIQS calculation result
 * @returns True if this is a nighttime calculation
 */
export function isNighttimeSiqsCalculation(siqsResult: any): boolean {
  if (!siqsResult) return false;
  
  return (
    siqsResult.metadata?.calculationType === 'nighttime' ||
    siqsResult.isNighttimeCalculation ||
    siqsResult.factors?.some((f: any) => f.nighttimeData)
  );
}

/**
 * Calculate nighttime SIQS based on forecast data
 * @param location Location with weather data
 * @param forecastData Forecast data with hourly forecasts
 * @param params Optional calculation parameters
 * @returns SIQS calculation result
 */
export function calculateNighttimeSIQS(location: any, forecastData: any, params: any | null): any {
  // For now, just return a simple placeholder implementation
  // This function should be implemented properly in a real application
  if (!location || !forecastData || !forecastData.hourly) {
    return null;
  }
  
  return {
    score: location.siqs || 5,
    isViable: true,
    factors: [],
    metadata: {
      calculationType: 'nighttime',
      timestamp: new Date().toISOString()
    }
  };
}
