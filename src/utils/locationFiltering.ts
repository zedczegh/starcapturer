
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Filter out invalid locations (those without latitude/longitude)
 */
export const filterValidLocations = (locations: SharedAstroSpot[]): SharedAstroSpot[] => {
  return locations.filter(loc => 
    loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number'
  );
};

/**
 * Check if a location is certified (Dark Sky Reserve or has certification)
 */
export const isCertifiedLocation = (location: SharedAstroSpot): boolean => {
  if (!location) return false;
  return Boolean(location.isDarkSkyReserve || location.certification);
};

/**
 * Separate locations into certified and calculated types
 */
export const separateLocationTypes = (locations: SharedAstroSpot[]) => {
  console.log(`Processing ${locations.length} locations for certified/calculated separation`);
  
  const certifiedLocations = locations.filter(loc => 
    loc.isDarkSkyReserve || loc.certification
  );
  
  const calculatedLocations = locations.filter(loc => 
    !loc.isDarkSkyReserve && !loc.certification
  );
  
  console.log(`Found ${certifiedLocations.length} certified locations (not filtered by distance)`);
  console.log(`Found ${certifiedLocations.length} certified and ${calculatedLocations.length} calculated locations`);
  
  return { certifiedLocations, calculatedLocations };
};

/**
 * Merge certified and calculated locations with proper priority
 */
export const mergeLocations = (
  certifiedLocations: SharedAstroSpot[], 
  calculatedLocations: SharedAstroSpot[],
  activeView: 'certified' | 'calculated'
): SharedAstroSpot[] => {
  // For certified view, only return certified locations
  if (activeView === 'certified') {
    return certifiedLocations;
  }
  
  // For calculated view, include both but prevent duplicates
  const locationMap = new Map<string, SharedAstroSpot>();
  
  // First add all certified locations (they take priority)
  certifiedLocations.forEach(loc => {
    if (loc.latitude && loc.longitude) {
      const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
      locationMap.set(key, loc);
    }
  });
  
  // Then add calculated locations without overriding certified ones
  calculatedLocations.forEach(loc => {
    if (loc.latitude && loc.longitude) {
      const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
      if (!locationMap.has(key)) {
        locationMap.set(key, loc);
      }
    }
  });
  
  return Array.from(locationMap.values());
};
