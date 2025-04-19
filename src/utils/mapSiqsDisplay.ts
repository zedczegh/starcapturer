
/**
 * Map SIQS Display Utilities
 * 
 * Provides consistent SIQS display functionality across all map components
 */

import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { hasCachedSiqs, getCachedSiqs, setSiqsCache } from '@/services/realTimeSiqs/siqsCache';
import { detectAndFixAnomalies, assessDataReliability } from '@/services/realTimeSiqs/siqsAnomalyDetector';
import { WeatherDataWithClearSky } from '@/services/realTimeSiqs/siqsTypes';

interface SiqsDisplayOptions {
  latitude: number;
  longitude: number;
  bortleScale?: number;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  existingSiqs?: number | null;
}

interface SiqsDisplayResult {
  siqs: number;
  loading: boolean;
  confidence: number; // 0-10 confidence score
  source: 'realtime' | 'cached' | 'default';
  timestamp: string;
}

// Cache duration constants
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const CERTIFIED_MINIMUM_SCORE = 6.5;
const DARK_SKY_RESERVE_MINIMUM_SCORE = 7.5;

/**
 * Get real-time SIQS for map display with consistent formatting
 */
export async function getMapDisplaySiqs({
  latitude,
  longitude,
  bortleScale = 4,
  isCertified = false,
  isDarkSkyReserve = false,
  existingSiqs = null
}: SiqsDisplayOptions): Promise<SiqsDisplayResult> {
  
  // Default result with existing SIQS or fallback value
  const defaultResult: SiqsDisplayResult = {
    siqs: existingSiqs !== null && existingSiqs > 0 ? existingSiqs : 
          isDarkSkyReserve ? DARK_SKY_RESERVE_MINIMUM_SCORE : 
          isCertified ? CERTIFIED_MINIMUM_SCORE : 0,
    loading: false,
    confidence: isCertified ? 8 : 5,
    source: 'default',
    timestamp: new Date().toISOString()
  };
  
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return defaultResult;
  }
  
  try {
    // Check cache first
    if (hasCachedSiqs(latitude, longitude)) {
      const cachedData = getCachedSiqs(latitude, longitude);
      if (cachedData && cachedData.siqs > 0) {
        const cachedTimestamp = cachedData.metadata?.calculatedAt || new Date().toISOString();
        const cacheAge = Date.now() - new Date(cachedTimestamp).getTime();
        
        if (cacheAge < CACHE_DURATION) {
          return {
            siqs: cachedData.siqs,
            loading: false,
            confidence: 9,
            source: 'cached',
            timestamp: cachedTimestamp
          };
        }
      }
    }
    
    // Calculate real-time SIQS
    const result = await calculateRealTimeSiqs(
      latitude, 
      longitude, 
      isCertified ? Math.min(bortleScale, 4) : bortleScale
    );
    
    if (!result || result.siqs <= 0) {
      return defaultResult;
    }
    
    // Create a default weather data object if none exists in the result
    const weatherData: WeatherDataWithClearSky = result.weatherData || {
      cloudCover: 0, 
      precipitation: 0,
      latitude, 
      longitude,
      temperature: 0,
      humidity: 0,
      windSpeed: 0
    } as WeatherDataWithClearSky;
    
    // Apply anomaly detection and correction
    const correctedResult = detectAndFixAnomalies(
      result,
      weatherData,
      { latitude, longitude }
    );
    
    // Get reliability assessment with safe access to forecastData
    const reliability = assessDataReliability(weatherData, result.forecastData || null);
    
    // For certified locations, ensure minimum scores
    let finalScore = correctedResult.siqs;
    if (isDarkSkyReserve) {
      finalScore = Math.max(finalScore, DARK_SKY_RESERVE_MINIMUM_SCORE);
    } else if (isCertified) {
      finalScore = Math.max(finalScore, CERTIFIED_MINIMUM_SCORE);
    }
    
    // Apply reliability adjustment for non-certified locations only
    if (!isCertified && !isDarkSkyReserve && reliability.confidenceScore < 7) {
      // Blend with default score based on confidence
      const confidenceWeight = reliability.confidenceScore / 10;
      finalScore = (finalScore * confidenceWeight) + (defaultResult.siqs * (1 - confidenceWeight));
    }
    
    return {
      siqs: parseFloat(finalScore.toFixed(1)),
      loading: false,
      confidence: reliability.confidenceScore,
      source: 'realtime',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error getting real-time SIQS for map display:", error);
    return defaultResult;
  }
}

/**
 * Format SIQS for consistent display
 */
export function formatMapSiqs(siqs: number | null): string {
  if (siqs === null || siqs <= 0) {
    return "N/A";
  }
  
  return siqs.toFixed(1);
}

/**
 * Get color class for SIQS value
 */
export function getSiqsColorClass(siqs: number | null): string {
  if (siqs === null || siqs <= 0) {
    return 'text-muted-foreground';
  }
  
  if (siqs >= 8) return 'text-green-500';
  if (siqs >= 6.5) return 'text-lime-500';
  if (siqs >= 5) return 'text-yellow-500';
  if (siqs >= 3.5) return 'text-orange-500';
  return 'text-red-500';
}
