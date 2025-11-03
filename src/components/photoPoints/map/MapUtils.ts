import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { isWaterLocation } from '@/utils/validation';

/**
 * Filter locations based on various criteria
 */
export const filterLocations = (
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number,
  activeView: 'certified' | 'calculated' | 'obscura'
): SharedAstroSpot[] => {
  // Basic validation
  if (!locations || locations.length === 0) {
    return [];
  }

  // First separate certified and non-certified locations
  const certifiedLocations = locations.filter(
    loc => loc.isDarkSkyReserve || loc.certification
  );
  
  let nonCertifiedLocations = locations.filter(
    loc => !loc.isDarkSkyReserve && !loc.certification
  );

  // For the calculated view, filter non-certified locations by distance
  if (activeView === 'calculated' && userLocation) {
    nonCertifiedLocations = nonCertifiedLocations.filter(loc => {
      // Skip invalid locations
      if (!loc.latitude || !loc.longitude) return false;
      
      // Calculate distance from user
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        loc.latitude,
        loc.longitude
      );
      
      // Keep locations within search radius that aren't in water
      return distance <= searchRadius && !isWaterLocation(loc.latitude, loc.longitude, false);
    });
  }

  // For certified view, only return certified locations
  if (activeView === 'certified') {
    return certifiedLocations;
  }
  
  // For obscura view, return all locations (obscura locations are typically passed in)
  if (activeView === 'obscura') {
    return locations;
  }
  
  // For calculated view, return both filtered non-certified and all certified
  return [...certifiedLocations, ...nonCertifiedLocations];
};

/**
 * Optimize locations for mobile display
 */
export const optimizeLocationsForMobile = (
  locations: SharedAstroSpot[],
  isMobile: boolean,
  activeView: 'certified' | 'calculated' | 'obscura'
): SharedAstroSpot[] => {
  if (!isMobile || locations.length <= 30) {
    return locations;
  }

  // Always keep certified locations
  const certified = locations.filter(loc => 
    loc.isDarkSkyReserve || loc.certification
  );
  
  // Reduce the number of non-certified locations on mobile
  const nonCertified = locations
    .filter(loc => !loc.isDarkSkyReserve && !loc.certification)
    .filter((_, index) => index % (activeView === 'certified' ? 4 : 2) === 0)
    .slice(0, 50); // Hard limit for better performance
  
  return [...certified, ...nonCertified];
};
