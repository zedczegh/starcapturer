
/**
 * Optimized SIQS Calculator
 * 
 * This service provides real-time SIQS calculation with performance optimizations
 */

import { fetchWeatherData } from "@/lib/api";
import { hasCachedSiqs, getCachedSiqs, setSiqsCache } from "./siqsCache";
import { SiqsResult } from "./siqsTypes";

/**
 * Calculate real-time SIQS for a location with optimized performance
 */
export async function calculateRealTimeSiqs(
  latitude: number, 
  longitude: number, 
  bortleScale: number
): Promise<SiqsResult> {
  if (!isFinite(latitude) || !isFinite(longitude)) {
    console.error("Invalid coordinates provided to calculateRealTimeSiqs");
    return { siqs: 0, isViable: false };
  }
  
  // Check cache first for immediate response
  if (hasCachedSiqs(latitude, longitude)) {
    const cachedData = getCachedSiqs(latitude, longitude);
    if (cachedData) {
      return cachedData;
    }
  }
  
  try {
    // Quick weather check
    const weatherData = await fetchWeatherData({ latitude, longitude });
    
    if (!weatherData) {
      return { siqs: 0, isViable: false };
    }
    
    // Simple SIQS calculation for better performance
    let score = 0;
    
    // Adjust for Bortle scale (1-9)
    const bortleScore = Math.max(0, 10 - bortleScale * 1.1);
    
    // Adjust for cloud cover (0-100%)
    const cloudCover = weatherData.cloudCover || 0;
    const cloudScore = Math.max(0, 10 - (cloudCover / 10));
    
    // Calculate basic score
    score = (bortleScore * 0.5) + (cloudScore * 0.5);
    
    // Ensure score is between 0 and 10
    score = Math.max(0, Math.min(10, score));
    
    // Round to one decimal place
    const finalScore = Math.round(score * 10) / 10;
    
    // Create result object
    const result: SiqsResult = {
      siqs: finalScore,
      isViable: finalScore >= 3.0,
      factors: [
        { name: "Cloud Cover", score: cloudScore / 10, description: `Cloud cover of ${cloudCover}%` },
        { name: "Light Pollution", score: bortleScore / 10, description: `Bortle Scale ${bortleScale}` }
      ]
    };
    
    // Cache the result
    setSiqsCache(latitude, longitude, result);
    
    return result;
  } catch (error) {
    console.error("Error calculating real-time SIQS:", error);
    return { siqs: 0, isViable: false };
  }
}

/**
 * Calculate SIQS for multiple locations in a batch
 */
export async function batchCalculateRealTimeSiqs(
  locations: Array<{ latitude: number; longitude: number; bortleScale?: number }>
): Promise<SiqsResult[]> {
  const results: SiqsResult[] = [];
  
  // Process in smaller batches for better performance
  const batchSize = 3;
  
  for (let i = 0; i < locations.length; i += batchSize) {
    const batch = locations.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(loc => calculateRealTimeSiqs(loc.latitude, loc.longitude, loc.bortleScale || 5))
    );
    
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Clear SIQS calculation cache
 */
export function clearSiqsCache() {
  try {
    // Clear from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('siqs_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Error clearing SIQS cache:", error);
  }
}
