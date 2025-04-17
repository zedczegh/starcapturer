
import { isValidAstronomyLocation } from './locationValidator';

/**
 * Check if location is a certified dark sky location
 */
export function isCertifiedLocation(location: any): boolean {
  if (!location) return false;
  
  return Boolean(location.isDarkSkyReserve || location.certification);
}

/**
 * Filter locations by certification status
 */
export function filterCertifiedLocations(locations: any[]): any[] {
  if (!locations || !Array.isArray(locations)) return [];
  
  return locations.filter(loc => isCertifiedLocation(loc));
}

/**
 * Filter locations by calculation status
 */
export function filterCalculatedLocations(locations: any[]): any[] {
  if (!locations || !Array.isArray(locations)) return [];
  
  return locations.filter(loc => {
    // Ensure it's a valid location
    if (!isValidAstronomyLocation(loc)) return false;
    
    // Include locations with SIQS scores
    if (loc.siqsScore || loc.siqs || 
        (loc.siqsResult && (loc.siqsResult.score || loc.siqsResult.siqs))) {
      return true;
    }
    
    return false;
  });
}
