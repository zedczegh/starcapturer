
/**
 * Services for real-time SIQS calculation
 */
import { calculateSIQS } from '@/lib/calculateSIQS';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore } from '@/utils/siqsHelpers';

// Simple in-memory cache
const siqsCache: Map<string, { score: number; timestamp: number }> = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Calculate SIQS for a location
 * @param location Location to calculate SIQS for
 * @returns The updated location with SIQS score
 */
export async function calculateSiqs(location: SharedAstroSpot): Promise<SharedAstroSpot> {
  try {
    const cacheKey = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
    const cached = siqsCache.get(cacheKey);
    
    // Use cached result if available and recent
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return {
        ...location,
        siqs: cached.score
      };
    }
    
    // Calculate SIQS using the existing function
    const siqsData = await calculateSIQS(
      location.latitude, 
      location.longitude, 
      location.bortleScale || 4
    );
    
    // Cache the result
    siqsCache.set(cacheKey, {
      score: siqsData.score,
      timestamp: Date.now()
    });
    
    return {
      ...location,
      siqs: siqsData.score
    };
  } catch (error) {
    console.error("Error calculating SIQS:", error);
    // Return the original location if calculation fails
    return location;
  }
}

/**
 * Calculate SIQS for multiple locations in batch
 * @param locations Array of locations
 * @returns Array of locations with SIQS scores
 */
export async function batchCalculateSiqs(locations: SharedAstroSpot[]): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return [];
  
  const results: SharedAstroSpot[] = [];
  
  // Process in small batches to avoid overwhelming APIs
  const batchSize = 3;
  
  for (let i = 0; i < locations.length; i += batchSize) {
    const batch = locations.slice(i, i + batchSize);
    
    // Process batch in parallel
    const batchPromises = batch.map(location => calculateSiqs(location));
    const batchResults = await Promise.all(batchPromises);
    
    results.push(...batchResults);
    
    // Small delay between batches to prevent rate limiting
    if (i + batchSize < locations.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  return results;
}

/**
 * Calculate real-time SIQS for a location with any additional parameters
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param bortleScale Bortle Scale value (1-9)
 * @returns SIQS result with score
 */
export async function calculateRealTimeSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number
): Promise<{ siqs: number; isViable: boolean; factors?: Array<{ name: string; score: number }> }> {
  try {
    // Use the existing SIQS calculation function
    const result = await calculateSIQS(latitude, longitude, bortleScale);
    
    return {
      siqs: result.score,
      isViable: result.score >= 3.5,
      factors: result.factors
    };
  } catch (error) {
    console.error("Error calculating real-time SIQS:", error);
    return {
      siqs: 0,
      isViable: false
    };
  }
}

/**
 * Clear the SIQS cache for testing or force refreshing
 */
export function clearSiqsCache(): void {
  siqsCache.clear();
}
