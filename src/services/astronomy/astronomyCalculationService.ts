
/**
 * Astronomy Calculation Service
 * Handles astronomical calculations with memoization and batch processing
 * for improved performance
 */

import { getAstronomicalNight, getOptimalViewingPeriod } from '@/utils/weather/astronomicalTimeUtils';
import { calculateMilkyWayVisibility } from '@/utils/weather/milkyWayCalculator';

// Type definitions for astronomical data
export interface AstronomicalData {
  astronomicalNight: {
    start: Date;
    end: Date;
    duration: number;
  };
  optimalViewing: {
    start: Date;
    end: Date;
  };
  milkyWay: {
    rise: string;
    set: string;
    duration: string;
    bestViewing: string;
    isVisible: boolean;
  };
}

// Dedicated cache for combined astronomical calculations
const astronomyCache = new Map<string, {
  data: AstronomicalData;
  timestamp: number;
  validFor: number;
}>();

/**
 * Get comprehensive astronomical data for a location with optimized calculations
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param date Date to calculate for (optional)
 * @returns Combined astronomical data
 */
export function getAstronomicalData(
  latitude: number,
  longitude: number,
  date = new Date()
): AstronomicalData {
  // Generate cache key
  const dateString = date.toISOString().split('T')[0];
  const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)},${dateString}`;
  
  // Check cache
  const cachedData = astronomyCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp) < cachedData.validFor) {
    return cachedData.data;
  }
  
  // Calculate all astronomical data efficiently
  const { start, end } = getAstronomicalNight(latitude, longitude, date);
  const optimalViewing = getOptimalViewingPeriod(latitude, longitude, date);
  const milkyWay = calculateMilkyWayVisibility(latitude, longitude, date);
  
  // Calculate duration
  const durationMs = end.getTime() - start.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  
  const result: AstronomicalData = {
    astronomicalNight: {
      start,
      end,
      duration: Math.round(durationHours * 10) / 10 // Round to 1 decimal
    },
    optimalViewing,
    milkyWay
  };
  
  // Cache the result
  astronomyCache.set(cacheKey, {
    data: result,
    timestamp: Date.now(),
    validFor: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  // Clean up cache if needed
  if (astronomyCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of astronomyCache.entries()) {
      if (now - value.timestamp > value.validFor) {
        astronomyCache.delete(key);
      }
    }
  }
  
  return result;
}

/**
 * Format astronomical time to display string
 * @param date Date to format
 * @returns Formatted time string
 */
export function formatAstronomicalTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Batch process astronomical data for multiple locations
 * @param locations Array of location coordinates
 * @returns Map of location keys to astronomical data
 */
export function batchProcessAstronomicalData(
  locations: Array<{ latitude: number; longitude: number; key: string }>
): Map<string, AstronomicalData> {
  const results = new Map<string, AstronomicalData>();
  const date = new Date();
  
  for (const location of locations) {
    const data = getAstronomicalData(location.latitude, location.longitude, date);
    results.set(location.key, data);
  }
  
  return results;
}

/**
 * Clear astronomy calculation caches
 */
export function clearAstronomyCaches(): void {
  astronomyCache.clear();
}
