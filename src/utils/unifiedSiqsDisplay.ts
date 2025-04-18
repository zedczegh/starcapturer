/**
 * Unified SIQS Display Utility
 * 
 * This file provides a single source of truth for displaying SIQS scores
 * consistently across all map markers and popups.
 */

import { getSiqsScore } from './siqsHelpers';
import { formatMapSiqs, getSiqsColorClass } from './mapSiqsDisplay';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { hasCachedSiqs, getCachedSiqs, setSiqsCache } from '@/services/realTimeSiqs/siqsCache';

// We don't use default SIQS values for certified locations anymore
export const DEFAULT_SIQS = 0;

interface SiqsDisplayOptions {
  latitude: number;
  longitude: number;
  bortleScale?: number;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  existingSiqs?: number | any;
}

interface SiqsResult {
  siqs: number;
  loading: boolean;
  formattedSiqs: string;
  colorClass: string;
  source: 'realtime' | 'cached' | 'default';
}

/**
 * Get the appropriate display SIQS score based on available data
 * Never use default scores for certified locations
 */
export function getDisplaySiqs(options: {
  realTimeSiqs: number | null;
  staticSiqs: number;
  isCertified: boolean;
  isDarkSkyReserve: boolean;
}): number {
  const { realTimeSiqs, staticSiqs, isCertified } = options;
  
  // Use realtime SIQS if available
  if (realTimeSiqs !== null && realTimeSiqs > 0) {
    return realTimeSiqs;
  }
  
  // Use static SIQS if available
  if (staticSiqs > 0) {
    return staticSiqs;
  }
  
  // No default scores for certified locations
  if (isCertified) {
    return 0; // Return 0 for certified locations if no real data
  }
  
  return DEFAULT_SIQS; // Only use default for non-certified locations
}

/**
 * Get the appropriate SIQS score from any location object
 */
export function getLocationSiqs(location: any, realTimeSiqs: number | null = null): number {
  // Extract certification status
  const isCertified = Boolean(
    location?.isDarkSkyReserve || 
    location?.certification || 
    location?.type === 'lodging' || 
    location?.type === 'dark-site'
  );
  
  const isDarkSkyReserve = Boolean(location?.isDarkSkyReserve);
  
  // Get static SIQS from location
  const staticSiqs = getSiqsScore(location);
  
  // Get appropriate display SIQS
  return getDisplaySiqs({
    realTimeSiqs,
    staticSiqs,
    isCertified,
    isDarkSkyReserve
  });
}

/**
 * Format SIQS for display with consistent formatting
 */
export function formatSiqsForDisplay(siqs: number | null): string {
  if (siqs === null || siqs <= 0) {
    return "N/A";
  }
  
  return siqs.toFixed(1);
}

/**
 * Get cached SIQS with optimized performance
 */
export function getCachedRealTimeSiqs(latitude: number, longitude: number): number | null {
  if (hasCachedSiqs(latitude, longitude)) {
    const cached = getCachedSiqs(latitude, longitude);
    if (cached && cached.siqs > 0) {
      return cached.siqs;
    }
  }
  return null;
}

/**
 * Simplified SIQS calculation based primarily on nighttime cloud cover
 * This provides a quick estimate for locations when we want to avoid complex calculations
 */
export function calculateSimplifiedSiqs(cloudCover: number, bortleScale: number = 4): number {
  // Base score determined by cloud cover (0-100%)
  // 0% clouds = 10, 100% clouds = 0
  const cloudScore = Math.max(0, 10 - (cloudCover / 10));
  
  // Adjust for Bortle scale (1-9)
  // Lower Bortle = better score
  const bortleAdjustment = Math.max(0, 5 - (bortleScale / 2));
  
  // Simple weighted combination
  // 70% cloud cover, 30% Bortle scale
  const rawScore = (cloudScore * 0.7) + (bortleAdjustment * 0.3);
  
  // Round to one decimal place and ensure within 0-10 range
  return Math.round(Math.min(10, Math.max(0, rawScore)) * 10) / 10;
}

/**
 * All-in-one function to get complete SIQS display information
 * No default scores for certified locations
 */
export async function getCompleteSiqsDisplay(options: SiqsDisplayOptions): Promise<SiqsResult> {
  const { 
    latitude, 
    longitude, 
    bortleScale = 4, 
    isCertified = false, 
    isDarkSkyReserve = false,
    existingSiqs = null
  } = options;
  
  // Get existing SIQS, without defaults for certified locations
  const staticSiqs = existingSiqs !== null ? getSiqsScore(existingSiqs) : 0;
                      
  const defaultResult: SiqsResult = {
    siqs: isCertified ? 0 : staticSiqs, // Never use default for certified
    loading: false,
    formattedSiqs: formatSiqsForDisplay(staticSiqs > 0 ? staticSiqs : null),
    colorClass: getSiqsColorClass(staticSiqs),
    source: 'default'
  };
  
  // Check for invalid coordinates
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return defaultResult;
  }
  
  try {
    // Try to get cached SIQS first
    const cachedSiqs = getCachedRealTimeSiqs(latitude, longitude);
    if (cachedSiqs !== null) {
      return {
        siqs: cachedSiqs,
        loading: false,
        formattedSiqs: formatSiqsForDisplay(cachedSiqs),
        colorClass: getSiqsColorClass(cachedSiqs),
        source: 'cached'
      };
    }
    
    // For certified locations, use simplified calculation if the full calculation fails
    try {
      // Try the full calculation first
      const result = await calculateRealTimeSiqs(
        latitude,
        longitude,
        bortleScale
      );
      
      if (result && result.siqs > 0) {
        // Use actual calculated score
        const finalScore = result.siqs;
        
        // Cache the result to avoid repeated calculations
        setSiqsCache(latitude, longitude, result);
        
        return {
          siqs: finalScore,
          loading: false,
          formattedSiqs: formatSiqsForDisplay(finalScore),
          colorClass: getSiqsColorClass(finalScore),
          source: 'realtime'
        };
      }
    } catch (error) {
      console.log("Full SIQS calculation failed, using simplified method:", error);
    }
    
    // If we're still here and this is a certified location, use simplified calculation
    if (isCertified) {
      try {
        // Get current cloud cover data directly
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=cloud_cover&timezone=auto`);
        const weatherData = await weatherResponse.json();
        
        if (weatherData && weatherData.current && weatherData.current.cloud_cover !== undefined) {
          // Use simplified calculation based mainly on cloud cover
          const cloudCover = weatherData.current.cloud_cover;
          console.log(`Using simplified calculation with cloud cover ${cloudCover}% for certified location`);
          
          const simplifiedScore = calculateSimplifiedSiqs(cloudCover, bortleScale);
          
          // Cache result using simplified method - use proper metadata format
          setSiqsCache(latitude, longitude, {
            siqs: simplifiedScore,
            isViable: simplifiedScore > 3,
            metadata: { 
              calculatedAt: new Date().toISOString(),
              sources: {
                weather: true,
                forecast: false,
                clearSky: false,
                lightPollution: true
              },
              reliability: {
                score: 7,
                issues: ["Using simplified calculation"]
              }
            }
          });
          
          return {
            siqs: simplifiedScore,
            loading: false,
            formattedSiqs: formatSiqsForDisplay(simplifiedScore),
            colorClass: getSiqsColorClass(simplifiedScore),
            source: 'realtime'
          };
        }
      } catch (error) {
        console.error("Simplified SIQS calculation failed:", error);
      }
    }
    
    // If we reach here, we couldn't calculate SIQS for some reason
    // For certified locations, return 0 instead of using default
    if (isCertified) {
      return {
        siqs: 0,
        loading: true, // Always show loading for certified locations with no data
        formattedSiqs: "N/A",
        colorClass: "text-muted-foreground",
        source: 'default'
      };
    }
    
    return defaultResult;
  } catch (error) {
    console.error("Error getting SIQS display data:", error);
    
    // For certified locations with errors, show loading instead of default
    if (isCertified) {
      return {
        siqs: 0,
        loading: true,
        formattedSiqs: "N/A",
        colorClass: "text-muted-foreground",
        source: 'default'
      };
    }
    
    return defaultResult;
  }
}
