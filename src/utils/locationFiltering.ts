
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Determine if a location is certified (either Dark Sky Reserve or has certification)
 */
export function isCertifiedLocation(location: SharedAstroSpot): boolean {
  return Boolean(
    location.isDarkSkyReserve ||
    location.certification ||
    location.type === 'dark-site'
  );
}

/**
 * Filter locations that have valid properties
 */
export function filterValidLocations(
  locations: SharedAstroSpot[]
): SharedAstroSpot[] {
  return locations.filter(loc => 
    loc && 
    typeof loc.latitude === 'number' && 
    typeof loc.longitude === 'number' &&
    !Number.isNaN(loc.latitude) &&
    !Number.isNaN(loc.longitude)
  );
}

/**
 * Separate locations into certified and calculated types
 */
export function separateLocationTypes(
  locations: SharedAstroSpot[]
): {
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
} {
  const certified: SharedAstroSpot[] = [];
  const calculated: SharedAstroSpot[] = [];
  
  locations.forEach(loc => {
    if (isCertifiedLocation(loc)) {
      certified.push(loc);
    } else {
      calculated.push(loc);
    }
  });
  
  console.log(`Processing ${locations.length} locations for certified/calculated separation`);
  console.log(`Found ${certified.length} certified and ${calculated.length} calculated locations`);
  
  return {
    certifiedLocations: certified,
    calculatedLocations: calculated
  };
}

/**
 * Merge arrays of locations with deduplication by coordinates
 */
export function mergeLocations(
  ...locationArrays: SharedAstroSpot[][]
): SharedAstroSpot[] {
  const locationMap = new Map<string, SharedAstroSpot>();
  
  locationArrays.forEach(locations => {
    if (Array.isArray(locations)) {
      locations.forEach(loc => {
        if (loc && loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          // If we already have a location at this coordinate, prefer certified ones
          if (!locationMap.has(key) || isCertifiedLocation(loc)) {
            locationMap.set(key, loc);
          }
        }
      });
    }
  });
  
  return Array.from(locationMap.values());
}
