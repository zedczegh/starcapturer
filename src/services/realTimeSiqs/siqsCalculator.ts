
/**
 * Real-time SIQS Calculator Service
 * 
 * This service calculates SIQS (Sky Quality Score) in real-time
 * without any caching to ensure the most accurate current data.
 */

// Import dependencies
import { fetchWeatherData } from '@/lib/api';

interface SiqsCalculationOptions {
  latitude: number;
  longitude: number;
  bortleScale?: number;
}

export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  weatherData?: any;
  forecastData?: any;
  factors?: {
    name: string;
    score: number;
    description: string;
  }[];
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
    // Fetch current weather data with error handling
    const weatherData = await fetchWeatherData({
      latitude,
      longitude
    });
    
    if (!weatherData) {
      console.error('Weather data not available - returning fallback value');
      return {
        siqs: 5.0, // Default fallback value
        isViable: true,
        weatherData: null,
        factors: [
          { 
            name: "Default", 
            score: 5.0, 
            description: `No weather data available`
          }
        ],
        metadata: {
          calculatedAt: new Date().toISOString(),
          sources: {
            weather: false,
            forecast: false,
            clearSky: false,
            lightPollution: true
          },
          reliability: {
            score: 3,
            issues: ["Missing weather data"]
          }
        }
      };
    }
    
    // Calculate SIQS based on current conditions
    const cloudCover = typeof weatherData.cloudCover === 'number' ? weatherData.cloudCover : 0;
    
    // Type-safe access to visibility property if it exists, or use default
    const visibility = typeof (weatherData as any).visibility === 'number' ? 
      (weatherData as any).visibility : 10000;
    
    // Type-safe access to isDay property if it exists, or use default
    const isNight = (weatherData as any).isDay === 0 || false;
    
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
    const currentHour = new Date().getHours();
    const isDarkHours = isNight || (currentHour >= 18 || currentHour <= 5);
    const isViable = finalScore >= 3.5 && isDarkHours;

    // Add the weatherData to the result
    const result: SiqsResult = {
      siqs: finalScore,
      isViable,
      weatherData: weatherData,
      factors: [
        { 
          name: "Cloud Cover", 
          score: cloudFactor, 
          description: `${cloudCover}% cloud cover impacts visibility`
        },
        { 
          name: "Light Pollution", 
          score: bortleFactor, 
          description: `Bortle ${bortleScale} light pollution level`
        },
        { 
          name: "Visibility", 
          score: visibilityFactor, 
          description: `Atmospheric visibility conditions`
        }
      ],
      metadata: {
        calculatedAt: new Date().toISOString(),
        sources: {
          weather: true,
          forecast: false,
          clearSky: isDarkHours,
          lightPollution: true
        },
        reliability: {
          score: 8,
          issues: cloudCover > 80 ? ["Heavy cloud cover"] : []
        }
      }
    };
    
    // Debug log the result
    console.log(`SIQS calculation successful - score: ${finalScore}`);
    
    return result;
  } catch (error) {
    console.error('Error calculating real-time SIQS:', error);
    // Return a fallback value so the UI doesn't break
    return {
      siqs: 5.0, // Default fallback value
      isViable: true,
      weatherData: null,
      factors: [
        { 
          name: "Fallback", 
          score: 5.0, 
          description: `Error in calculation, using fallback value`
        }
      ],
      metadata: {
        calculatedAt: new Date().toISOString(),
        sources: {
          weather: false,
          forecast: false,
          clearSky: false,
          lightPollution: true
        },
        reliability: {
          score: 3,
          issues: ["Calculation error"]
        }
      }
    };
  }
}

/**
 * Clear location cache - this is now a no-op since we don't use caching
 */
export function clearLocationCache(): void {
  console.log('SIQS cache system has been disabled - all calculations are real-time');
}

/**
 * Get estimated cache freshness - always returns 0 since we're not caching
 */
export function getCacheFreshness(): number {
  return 0; // Always fresh - no cache
}
