
/**
 * SIQS calculation and display utilities
 */

import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { setSiqsCache } from '@/services/realTimeSiqs/siqsCache';
import { getSiqsColorClass } from '@/utils/mapSiqsDisplay';
import { normalizeToSiqsScale } from '@/utils/siqsHelpers';

import { getCachedRealTimeSiqs } from './siqsCache';
import { formatSiqsForDisplay, calculateSimplifiedSiqs } from './formatters';
import type { SiqsDisplayOpts, SiqsResult } from './types';

/**
 * All-in-one function to get complete SIQS display information
 * No default scores for certified locations
 */
export async function getCompleteSiqsDisplay(options: SiqsDisplayOpts): Promise<SiqsResult> {
  const { 
    latitude, 
    longitude, 
    bortleScale = 4, 
    isCertified = false, 
    isDarkSkyReserve = false,
    existingSiqs = null,
    skipCache = false,
    useSingleHourSampling = false,
    targetHour = 1
  } = options;
  
  // Get existing SIQS, without defaults - never use default scores
  const staticSiqs = existingSiqs !== null ? getSiqsScore(existingSiqs) : 0;
                      
  const defaultResult: SiqsResult = {
    siqs: 0, // Never use default scores - return 0 instead
    loading: isCertified, // Show loading for certified locations with no score
    formattedSiqs: formatSiqsForDisplay(staticSiqs > 0 ? staticSiqs : null),
    colorClass: getSiqsColorClass(staticSiqs),
    source: 'default'
  };
  
  // Check for invalid coordinates
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return defaultResult;
  }
  
  try {
    // Try to get cached SIQS first (unless we're skipping cache)
    if (!skipCache) {
      const cachedSiqs = getCachedRealTimeSiqs(latitude, longitude);
      if (cachedSiqs !== null) {
        // Ensure the cached SIQS is on the 0-10 scale
        const normalizedSiqs = normalizeToSiqsScale(cachedSiqs);
        return {
          siqs: normalizedSiqs,
          loading: false,
          formattedSiqs: formatSiqsForDisplay(normalizedSiqs),
          colorClass: getSiqsColorClass(normalizedSiqs),
          source: 'cached'
        };
      }
    } else {
      console.log(`Skipping cache for SIQS at ${latitude.toFixed(5)},${longitude.toFixed(5)}`);
    }
    
    // For certified locations, use simplified calculation if the full calculation fails
    try {
      // Try the full calculation first
      const calcOptions = useSingleHourSampling ? 
        { targetHour, useSingleHourSampling } : 
        undefined;
        
      const result = await calculateRealTimeSiqs(
        latitude,
        longitude,
        bortleScale,
        calcOptions
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
    // For certified locations, show loading instead of default score
    if (isCertified) {
      return {
        siqs: 0, // No default scores
        loading: true, // Always show loading for certified locations with no data
        formattedSiqs: "N/A",
        colorClass: "text-muted-foreground",
        source: 'default'
      };
    }
    
    return defaultResult;
  } catch (error) {
    console.error("Error getting SIQS display data:", error);
    
    // For certified locations with errors, show loading instead of default score
    if (isCertified) {
      return {
        siqs: 0, // No default scores
        loading: true,
        formattedSiqs: "N/A",
        colorClass: "text-muted-foreground",
        source: 'default'
      };
    }
    
    return defaultResult;
  }
}

// Helper function to get the SIQS score
function getSiqsScore(existingSiqs: any): number {
  if (typeof existingSiqs === 'number') {
    return existingSiqs;
  }
  
  if (existingSiqs && typeof existingSiqs === 'object') {
    if ('score' in existingSiqs) return existingSiqs.score;
    if ('siqs' in existingSiqs) return existingSiqs.siqs;
  }
  
  return 0;
}
