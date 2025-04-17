
/**
 * Utilities for filtering and categorizing locations
 */

/**
 * Check if a location is certified or has dark sky status
 */
export function isCertifiedLocation(location: any): boolean {
  if (!location) return false;
  
  return Boolean(
    location.isDarkSkyReserve || 
    location.certification || 
    location.hasDarkSkyStatus
  );
}

/**
 * Check if a location is suitable for good astrophotography
 */
export function isGoodAstroLocation(location: any): boolean {
  // If it's certified, it's definitely good
  if (isCertifiedLocation(location)) {
    return true;
  }
  
  // Otherwise, check SIQS score
  const siqs = getSiqs(location);
  return siqs >= 6.0; // Good threshold
}

/**
 * Check if a location has excellent viewing conditions
 */
export function isExcellentLocation(location: any): boolean {
  // Certified locations might still not be excellent
  if (isCertifiedLocation(location)) {
    const siqs = getSiqs(location);
    return siqs >= 8.0; // Excellence threshold for certified locations
  }
  
  // For regular locations, be more strict
  const siqs = getSiqs(location);
  return siqs >= 7.5; // Excellence threshold for non-certified locations
}

/**
 * Get SIQS score, handling different formats
 */
function getSiqs(location: any): number {
  if (!location) return 0;
  
  if (location.siqsResult && typeof location.siqsResult.siqs === 'number') {
    return location.siqsResult.siqs;
  }
  
  if (typeof location.siqs === 'number') {
    return location.siqs;
  }
  
  return 0;
}

/**
 * Check if a location is a dark sky reserve
 */
export function isDarkSkyReserve(location: any): boolean {
  return Boolean(
    location && (
      location.isDarkSkyReserve === true || 
      location.certification === 'IDA Dark Sky Reserve' ||
      (location.type === 'dark-site' && location.certification)
    )
  );
}

/**
 * Sort locations by quality (SIQS score and certification status)
 */
export function sortLocationsByQuality(locations: any[]): any[] {
  if (!locations || !Array.isArray(locations)) {
    return [];
  }
  
  return [...locations].sort((a, b) => {
    // First sort by certification status
    const aIsCertified = isCertifiedLocation(a);
    const bIsCertified = isCertifiedLocation(b);
    
    if (aIsCertified && !bIsCertified) return -1;
    if (!aIsCertified && bIsCertified) return 1;
    
    // Then sort by SIQS score
    const aScore = getSiqs(a);
    const bScore = getSiqs(b);
    
    return bScore - aScore; // Higher scores first
  });
}

/**
 * Get location rating label
 */
export function getLocationRating(location: any): string {
  const siqs = getSiqs(location);
  
  if (siqs >= 8.5) return 'Exceptional';
  if (siqs >= 7.5) return 'Excellent';
  if (siqs >= 6.5) return 'Very Good';
  if (siqs >= 5.5) return 'Good';
  if (siqs >= 4.5) return 'Fair';
  if (siqs >= 3.5) return 'Moderate';
  return 'Poor';
}

// Adding these functions to address missing exports in useMapLocations
export function filterValidLocations(locations: any[]): any[] {
  if (!locations || !Array.isArray(locations)) {
    return [];
  }
  
  return locations.filter(location => {
    return location && location.latitude && location.longitude;
  });
}

export function separateLocationTypes(locations: any[]): { certifiedLocations: any[], calculatedLocations: any[] } {
  const certifiedLocations = locations.filter(loc => isCertifiedLocation(loc));
  const calculatedLocations = locations.filter(loc => !isCertifiedLocation(loc));
  
  return { certifiedLocations, calculatedLocations };
}

export function mergeLocations(certified: any[], calculated: any[]): any[] {
  return [...certified, ...calculated];
}

