/**
 * SIQS Corrections
 * 
 * This module provides correction functions for SIQS calculations
 * to ensure physical consistency and temporal stability.
 */

import { SiqsResult, WeatherDataWithClearSky } from './siqsTypes';

/**
 * Correct physically impossible or highly unlikely combinations in SIQS results
 */
export function correctPhysicalImpossibilities(
  siqs: SiqsResult, 
  weatherData: WeatherDataWithClearSky
): SiqsResult {
  if (!siqs || siqs.siqs <= 0) {
    return siqs;
  }
  
  let correctedSiqs = siqs.siqs;
  
  // Condition 1: High SIQS with high cloud cover is physically unlikely
  if (weatherData.cloudCover > 80 && siqs.siqs > 7) {
    const correctionFactor = 1 - ((weatherData.cloudCover - 80) / 100);
    correctedSiqs = siqs.siqs * correctionFactor;
    console.log(`Corrected impossible high SIQS (${siqs.siqs}) with high cloud cover (${weatherData.cloudCover}%) to ${correctedSiqs}`);
  }
  
  // Condition 2: Zero cloud cover should have minimum baseline quality
  if (weatherData.cloudCover < 5 && siqs.siqs < 3 && !weatherData.precipitation) {
    correctedSiqs = Math.max(3, siqs.siqs);
    console.log(`Corrected impossible low SIQS (${siqs.siqs}) with clear skies to ${correctedSiqs}`);
  }
  
  // Condition 3: Active precipitation means reduced visibility
  if (weatherData.precipitation && weatherData.precipitation > 1 && siqs.siqs > 5) {
    const rainFactor = 1 - (Math.min(10, weatherData.precipitation) / 20);
    correctedSiqs = siqs.siqs * rainFactor;
    console.log(`Corrected SIQS for precipitation (${weatherData.precipitation}mm) from ${siqs.siqs} to ${correctedSiqs}`);
  }
  
  // Return the original object with corrected score
  return {
    ...siqs,
    siqs: correctedSiqs
  };
}

/**
 * Prioritize nighttime cloud cover data when available
 */
export function prioritizeNighttimeCloudCover(
  siqs: SiqsResult,
  weatherData: WeatherDataWithClearSky
): SiqsResult {
  if (!siqs || siqs.siqs <= 0 || !weatherData.nighttimeCloudData) {
    return siqs;
  }
  
  const currentCloudCover = weatherData.cloudCover;
  const nighttimeCloudCover = weatherData.nighttimeCloudData.average;
  
  // If there's a significant difference, adjust SIQS based on nighttime data
  if (Math.abs(currentCloudCover - nighttimeCloudCover) > 20) {
    // Calculate how much the cloud cover affects SIQS (approximate)
    const cloudImpactPerPercent = 0.05;  // 0.05 SIQS points per 1% cloud cover
    const cloudDifference = currentCloudCover - nighttimeCloudCover;
    const siqsAdjustment = cloudDifference * cloudImpactPerPercent;
    
    // Apply the adjustment
    const adjustedSiqs = Math.min(10, Math.max(0, siqs.siqs + siqsAdjustment));
    
    console.log(`Adjusted SIQS from ${siqs.siqs} to ${adjustedSiqs} based on nighttime cloud data`);
    
    return {
      ...siqs,
      siqs: adjustedSiqs,
      factors: siqs.factors ? [
        ...siqs.factors,
        {
          name: 'Night Cloud Adjustment',
          score: siqsAdjustment * 10,
          description: `Adjusted for nighttime cloud cover (${nighttimeCloudCover}% vs current ${currentCloudCover}%)`
        }
      ] : siqs.factors
    };
  }
  
  return siqs;
}

/**
 * Ensure temporal consistency in SIQS values
 * Reduces rapid fluctuations that don't match physical reality
 */
export function ensureTemporalConsistency(
  siqs: SiqsResult,
  latitude: number,
  longitude: number
): SiqsResult {
  if (!siqs || siqs.siqs <= 0) {
    return siqs;
  }
  
  // Create a unique key for this location
  const locationKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // Get previous values from temporal cache
  const previousValues = getTemporalCache(locationKey);
  
  if (previousValues.length > 0) {
    // Calculate weighted average with recent values having more weight
    const totalWeight = previousValues.reduce((sum, entry, i) => sum + (previousValues.length - i), 0);
    const weightedSum = previousValues.reduce((sum, entry, i) => {
      const weight = previousValues.length - i;
      return sum + (entry.value * weight);
    }, 0);
    const recentAverage = weightedSum / totalWeight;
    
    // If current value deviates significantly from recent history, smooth it
    const deviation = Math.abs(siqs.siqs - recentAverage);
    if (deviation > 2) {
      // More extreme deviations get stronger smoothing
      const smoothingFactor = Math.min(0.7, deviation / 10);
      const smoothedValue = siqs.siqs * (1 - smoothingFactor) + recentAverage * smoothingFactor;
      
      console.log(`Smoothed temporal anomaly: ${siqs.siqs} -> ${smoothedValue} (avg: ${recentAverage})`);
      
      // Update temporal cache
      updateTemporalCache(locationKey, smoothedValue);
      
      return {
        ...siqs,
        siqs: smoothedValue
      };
    }
  }
  
  // Update cache with current value
  updateTemporalCache(locationKey, siqs.siqs);
  
  return siqs;
}

// Simple in-memory temporal cache (could be enhanced with persistent storage)
const temporalCache: Record<string, Array<{ value: number, timestamp: number }>> = {};
const MAX_CACHE_ENTRIES = 5;
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get temporal cache entries for a location
 */
function getTemporalCache(locationKey: string): Array<{ value: number, timestamp: number }> {
  if (!temporalCache[locationKey]) {
    return [];
  }
  
  // Filter out old entries
  const now = Date.now();
  return temporalCache[locationKey].filter(entry => (now - entry.timestamp) < MAX_CACHE_AGE_MS);
}

/**
 * Update temporal cache with new value
 */
function updateTemporalCache(locationKey: string, value: number): void {
  if (!temporalCache[locationKey]) {
    temporalCache[locationKey] = [];
  }
  
  // Add new entry
  temporalCache[locationKey].push({
    value,
    timestamp: Date.now()
  });
  
  // Keep only the most recent entries
  if (temporalCache[locationKey].length > MAX_CACHE_ENTRIES) {
    temporalCache[locationKey] = temporalCache[locationKey].slice(-MAX_CACHE_ENTRIES);
  }
}

/**
 * Clear old entries from all temporal caches
 */
export function cleanupTemporalCache(): void {
  const now = Date.now();
  
  Object.keys(temporalCache).forEach(key => {
    temporalCache[key] = temporalCache[key].filter(
      entry => (now - entry.timestamp) < MAX_CACHE_AGE_MS
    );
    
    // Remove empty caches
    if (temporalCache[key].length === 0) {
      delete temporalCache[key];
    }
  });
}

// Set up periodic cleanup
const cleanup = setInterval(cleanupTemporalCache, 3600 * 1000); // Clean every hour

// Ensure cleanup interval is properly managed
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    clearInterval(cleanup);
  });
}
