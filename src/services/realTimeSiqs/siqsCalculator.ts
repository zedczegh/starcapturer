
/**
 * Real-time SIQS Calculator Service
 * 
 * This service calculates SIQS (Sky Quality Score) in real-time
 * without any caching to ensure the most accurate current data.
 */

// Import dependencies (assume these are already defined elsewhere)
import { fetchWeatherData } from '@/lib/api';

interface SiqsCalculationOptions {
  latitude: number;
  longitude: number;
  bortleScale?: number;
}

export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  metadata: {
    calculatedAt: string;
    sources: {
      weather: boolean;
      forecast: boolean;
      clearSky: boolean;
      lightPollution: boolean;
    };
    reliability: {
      score: number;
      issues: string[];
    };
  };
}

/**
 * Calculate SIQS score in real-time for a given location
 * No caching - always get fresh data
 */
export async function calculateRealTimeSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number = 4
): Promise<SiqsResult> {
  console.log(`Calculating real-time SIQS for ${latitude.toFixed(5)},${longitude.toFixed(5)} with Bortle ${bortleScale}`);
  
  try {
    // Fetch current weather data
    const weatherData = await fetchWeatherData({
      latitude,
      longitude
    });
    
    if (!weatherData) {
      throw new Error('Weather data not available');
    }
    
    // Calculate SIQS based on current conditions
    const cloudCover = weatherData.current?.cloud_cover || 0;
    const visibility = weatherData.current?.visibility || 10000;
    const isNight = weatherData.current?.is_day === 0;
    
    // Cloud cover heavily impacts SIQS (0-100%)
    // 0% clouds = best, 100% = worst
    const cloudFactor = Math.max(0, 10 - (cloudCover / 10));
    
    // Bortle scale (1-9)
    // 1 = best, 9 = worst
    const bortleAdjusted = Math.max(1, Math.min(9, bortleScale));
    const bortleFactor = Math.max(0, 5 - (bortleAdjusted / 2));
    
    // Visibility factor (in meters)
    // Higher visibility = better
    const visibilityFactor = Math.min(5, visibility / 5000);
    
    // Combined score calculation with weights
    const combinedScore = (
      (cloudFactor * 0.6) +       // 60% cloud cover
      (bortleFactor * 0.3) +      // 30% light pollution (Bortle)
      (visibilityFactor * 0.1)    // 10% atmospheric visibility
    );
    
    // Normalize to 0-10 scale
    const normalizedScore = Math.max(0, Math.min(10, combinedScore));
    
    // Round to one decimal place
    const finalScore = Math.round(normalizedScore * 10) / 10;
    
    // Determine if conditions are viable for observation
    const isViable = finalScore >= 3.5 && isNight;
    
    // Return result with metadata
    return {
      siqs: finalScore,
      isViable,
      metadata: {
        calculatedAt: new Date().toISOString(),
        sources: {
          weather: true,
          forecast: false,
          clearSky: isNight,
          lightPollution: true
        },
        reliability: {
          score: 8,
          issues: cloudCover > 80 ? ["Heavy cloud cover"] : []
        }
      }
    };
  } catch (error) {
    console.error('Error calculating real-time SIQS:', error);
    throw error;
  }
}

/**
 * Clear location cache - this is now a no-op since we don't use caching
 */
export function clearLocationCache(): void {
  // No caching to clear
  console.log('SIQS cache system has been disabled - all calculations are real-time');
}

/**
 * Get estimated cache freshness - always returns 0 since we're not caching
 */
export function getCacheFreshness(): number {
  return 0; // Always fresh - no cache
}
