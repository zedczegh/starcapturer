/**
 * Utility functions for filtering and processing location data
 */
import { isValidAstronomyLocation, isWaterLocation } from './locationValidator';
import { haversineDistance } from './geoUtils';

// Check if a location is certified
export function isCertifiedLocation(location: any): boolean {
  return Boolean(
    location?.certification ||
    location?.isDarkSkyReserve ||
    location?.type === 'dark-site' ||
    location?.type === 'lodging'
  );
}

// Filter out invalid locations
export function filterValidLocations(locations: any[]): any[] {
  if (!Array.isArray(locations)) {
    return [];
  }
  
  return locations.filter(location => {
    // Must have valid coordinates
    if (!location || !location.latitude || !location.longitude) {
      return false;
    }
    
    // Not in water
    if (isWaterLocation(location)) {
      return false;
    }
    
    return true;
  });
}

// Separate locations by type
export function separateLocationTypes(locations: any[]): { 
  certified: any[],
  regular: any[]
} {
  const certified: any[] = [];
  const regular: any[] = [];
  
  if (!Array.isArray(locations)) {
    return { certified, regular };
  }
  
  locations.forEach(location => {
    if (isCertifiedLocation(location)) {
      certified.push(location);
    } else {
      regular.push(location);
    }
  });
  
  return { certified, regular };
}

// Merge multiple location arrays with deduplication
export function mergeLocations(
  locationsArrays: any[][],
  maxDistance: number = 1.0  // Maximum distance in kilometers to consider duplicates
): any[] {
  const allLocations: any[] = [];
  const seenKeys = new Set<string>();
  
  // Helper function to generate a location key
  const getLocationKey = (loc: any) => {
    return `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;
  };
  
  // Process all location arrays
  locationsArrays.forEach(locations => {
    if (!Array.isArray(locations)) return;
    
    locations.forEach(location => {
      // Skip invalid locations
      if (!location || !location.latitude || !location.longitude) {
        return;
      }
      
      // Check exact location key
      const locationKey = getLocationKey(location);
      if (seenKeys.has(locationKey)) {
        return; // Skip this duplicate
      }
      
      // Check for close locations
      let isDuplicate = false;
      for (const existingLocation of allLocations) {
        const distance = haversineDistance(
          location.latitude, location.longitude,
          existingLocation.latitude, existingLocation.longitude
        );
        
        if (distance < maxDistance) {
          // Keep the better location (certified or with higher SIQS score)
          if (isCertifiedLocation(location) && !isCertifiedLocation(existingLocation)) {
            // Remove the existing location and add the new certified one
            const index = allLocations.indexOf(existingLocation);
            if (index !== -1) {
              allLocations.splice(index, 1);
            }
            break;
          } else {
            isDuplicate = true;
            break;
          }
        }
      }
      
      if (!isDuplicate) {
        seenKeys.add(locationKey);
        allLocations.push(location);
      }
    });
  });
  
  return allLocations;
}
