
import { SharedAstroSpot } from "@/lib/api/astroSpots";

/**
 * Filter out invalid locations
 */
export function filterValidLocations(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  if (!locations || !Array.isArray(locations)) return [];
  
  return locations.filter(loc => 
    loc && 
    typeof loc.latitude === 'number' && 
    typeof loc.longitude === 'number' &&
    isFinite(loc.latitude) && 
    isFinite(loc.longitude)
  );
}

/**
 * Separate locations into certified and non-certified types
 */
export function separateLocationTypes(locations: SharedAstroSpot[]): {
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
} {
  const certifiedLocations: SharedAstroSpot[] = [];
  const calculatedLocations: SharedAstroSpot[] = [];
  
  locations.forEach(location => {
    if (location.isDarkSkyReserve || location.certification) {
      certifiedLocations.push(location);
    } else {
      calculatedLocations.push(location);
    }
  });
  
  return { certifiedLocations, calculatedLocations };
}

/**
 * Merge location arrays with deduplication
 */
export function mergeLocations(
  locationsA: SharedAstroSpot[],
  locationsB: SharedAstroSpot[]
): SharedAstroSpot[] {
  if (!locationsA || !Array.isArray(locationsA)) locationsA = [];
  if (!locationsB || !Array.isArray(locationsB)) locationsB = [];
  
  // Create a Map for O(1) lookups using coordinate string as key
  const uniqueLocations = new Map<string, SharedAstroSpot>();
  
  // Add locations from first array
  locationsA.forEach(loc => {
    if (loc && loc.latitude && loc.longitude) {
      const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
      uniqueLocations.set(key, loc);
    }
  });
  
  // Add locations from second array, potentially overwriting if duplicates
  locationsB.forEach(loc => {
    if (loc && loc.latitude && loc.longitude) {
      const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
      
      // If this is a certified location or the key doesn't exist yet, add it
      if (loc.isDarkSkyReserve || loc.certification || !uniqueLocations.has(key)) {
        uniqueLocations.set(key, loc);
      }
    }
  });
  
  // Convert Map back to array
  return Array.from(uniqueLocations.values());
}
