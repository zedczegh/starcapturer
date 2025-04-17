
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs } from './siqsCalculator';

/**
 * Batch calculate SIQS for multiple locations
 */
export async function batchCalculateSiqs(locations: SharedAstroSpot[]): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  console.log(`Calculating SIQS for ${locations.length} locations in batch`);
  
  try {
    // Process locations in batches to avoid overwhelming the system
    const batchSize = 5;
    const results: SharedAstroSpot[] = [];
    
    for (let i = 0; i < locations.length; i += batchSize) {
      const batch = locations.slice(i, i + batchSize);
      const batchPromises = batch.map(async (location) => {
        try {
          if (!location.latitude || !location.longitude || !location.bortleScale) {
            return location;
          }
          
          // Calculate SIQS for this location
          const siqsResult = await calculateRealTimeSiqs(
            location.latitude,
            location.longitude,
            location.bortleScale
          );
          
          // Return updated location with SIQS
          return {
            ...location,
            siqs: siqsResult.siqs,
            siqsResult
          };
        } catch (error) {
          console.error(`Error calculating SIQS for location ${location.name || 'unknown'}:`, error);
          return location;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add small delay between batches to avoid rate limiting
      if (i + batchSize < locations.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  } catch (error) {
    console.error("Error in batch SIQS calculation:", error);
    return locations;
  }
}

/**
 * Update locations with real-time SIQS data and add placeholders where needed
 */
export function addPlaceholderSiqsScores(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return locations.map(location => {
    // Skip locations that already have SIQS
    if (location.siqs) {
      return location;
    }
    
    // Use Bortle scale to determine a placeholder SIQS score
    let placeholderSiqs = 5.0;
    
    if (location.bortleScale) {
      // Convert Bortle scale (1-9) to SIQS (0-10)
      // Bortle 1 = best (10), Bortle 9 = worst (3)
      placeholderSiqs = Math.max(3, 11 - location.bortleScale);
    }
    
    // For certified locations, give a higher placeholder
    if (location.isDarkSkyReserve || location.certification) {
      placeholderSiqs = Math.max(placeholderSiqs, 7.0);
    }
    
    // Add placeholder SIQS
    return {
      ...location,
      siqs: placeholderSiqs
    };
  });
}
