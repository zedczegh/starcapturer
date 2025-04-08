
import { calculateSIQS } from '@/lib/calculateSIQS';
import { getConsistentSiqsValue } from '@/utils/nighttimeSIQS';
import { SharedAstroSpot, SIQSResult } from '@/lib/siqs/types';

/**
 * Calculate nighttime SIQS for a location
 */
export function calculateNighttimeSIQS(locationData: any, forecastData: any, t: any): SIQSResult | null {
  // This is a wrapper around the real implementation
  try {
    // Basic implementation until actual nighttime calculation is available
    const siqsScore = calculateSIQS({
      cloudCover: locationData?.weatherData?.cloudCover || 30,
      bortleScale: locationData?.bortleScale || 5,
      seeingConditions: 3,
      windSpeed: locationData?.weatherData?.windSpeed || 5,
      humidity: locationData?.weatherData?.humidity || 50
    });
    
    return {
      ...siqsScore,
      metadata: {
        calculationType: 'nighttime',
        timestamp: new Date().toISOString(),
        avgNightCloudCover: locationData?.weatherData?.cloudCover || 30
      }
    };
  } catch (error) {
    console.error("Error in calculateNighttimeSIQS:", error);
    return null;
  }
}

/**
 * Check if a SIQS result is from nighttime calculations
 */
export function isNighttimeSiqsCalculation(siqsResult: SIQSResult | undefined): boolean {
  if (!siqsResult) return false;
  return siqsResult.metadata?.calculationType === 'nighttime';
}

/**
 * Get consistent SIQS value from a location object
 */
export function getSiqsValue(location: SharedAstroSpot): number {
  return getConsistentSiqsValue(location);
}
