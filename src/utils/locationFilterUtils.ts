
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Filter locations based on active view and deduplication
 */
export const filterLocations = (
  activeView: 'certified' | 'calculated',
  certifiedLocations: SharedAstroSpot[],
  calculatedLocations: SharedAstroSpot[]
): SharedAstroSpot[] => {
  if (activeView === 'certified') {
    return certifiedLocations;
  }

  // Create a map for O(1) duplicate checking
  const locationMap = new Map<string, SharedAstroSpot>();

  // Add calculated locations first
  calculatedLocations.forEach(loc => {
    const key = `${loc.latitude}-${loc.longitude}`;
    locationMap.set(key, loc);
  });

  // Add certified locations that don't overlap with calculated ones
  certifiedLocations.forEach(loc => {
    const key = `${loc.latitude}-${loc.longitude}`;
    if (!locationMap.has(key)) {
      locationMap.set(key, loc);
    }
  });

  return Array.from(locationMap.values());
};

/**
 * Optimize locations for mobile display
 */
export const optimizeLocationsForMobile = (
  locations: SharedAstroSpot[],
  isMobile: boolean,
  activeView: 'certified' | 'calculated'
): SharedAstroSpot[] => {
  if (!isMobile || !locations || locations.length === 0) {
    return locations;
  }

  if (locations.length <= 30) {
    return locations;
  }

  const certified = locations.filter(loc => 
    loc.isDarkSkyReserve || loc.certification
  );

  const nonCertifiedSamplingRate = activeView === 'certified' ? 5 : 3;
  
  const nonCertified = locations
    .filter(loc => !loc.isDarkSkyReserve && !loc.certification)
    .filter((_, index) => index % nonCertifiedSamplingRate === 0)
    .slice(0, 40);

  return [...certified, ...nonCertified];
};
