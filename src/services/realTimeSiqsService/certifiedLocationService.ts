
import { calculateRealTimeSiqs } from '../realTimeSiqs/siqsCalculator';

/**
 * Update certified locations with SIQS data
 * 
 * This function prioritizes certified locations for SIQS calculations
 * with higher quality parameters appropriate for dark sky reserves
 * 
 * @param certifiedLocations Array of certified dark sky locations
 * @returns Updated locations with SIQS data
 */
export async function updateCertifiedLocationsWithSiqs(certifiedLocations: any[]) {
  if (!certifiedLocations || !certifiedLocations.length) return [];
  
  console.log(`Updating ${certifiedLocations.length} certified locations with SIQS data`);
  
  const updatedLocations = [...certifiedLocations];
  
  // Process serially to avoid overwhelming APIs
  for (let i = 0; i < certifiedLocations.length; i++) {
    const location = certifiedLocations[i];
    
    // Skip if no coordinates
    if (!location.latitude || !location.longitude) continue;
    
    try {
      // Use a lower Bortle scale for certified locations (they are typically darker)
      const bortleScale = location.bortleScale || 
        (location.isDarkSkyReserve ? 2 : 3);
      
      const siqsResult = await calculateRealTimeSiqs(
        location.latitude,
        location.longitude,
        bortleScale
      );
      
      // Update the location with SIQS data
      if (siqsResult && siqsResult.siqs > 0) {
        updatedLocations[i] = {
          ...location,
          siqsResult
        };
      }
      
      // Add a small delay between requests
      if (i < certifiedLocations.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    } catch (error) {
      console.error(`Error updating SIQS for certified location ${location.name || 'unknown'}:`, error);
    }
  }
  
  return updatedLocations;
}

/**
 * Clear cached SIQS data for certified locations
 */
export function clearCertifiedLocationCache() {
  // Find certified location cache entries in session storage
  const certifiedKeys: string[] = [];
  
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith('siqs_')) {
      try {
        const data = JSON.parse(sessionStorage.getItem(key) || '{}');
        if (data.metadata?.certified) {
          certifiedKeys.push(key);
        }
      } catch (e) {
        // Skip invalid entries
      }
    }
  }
  
  // Remove found entries
  certifiedKeys.forEach(key => sessionStorage.removeItem(key));
  console.log(`Cleared ${certifiedKeys.length} certified location cache entries`);
  
  return certifiedKeys.length;
}
