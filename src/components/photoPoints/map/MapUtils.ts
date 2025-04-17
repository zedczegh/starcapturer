import { SharedAstroSpot } from '@/types/weather';
import { calculateDistance } from '@/utils/geoUtils';
import { isWaterLocation } from '@/utils/locationWaterCheck';

/**
 * Filter locations by search radius and exclude water locations
 */
export const filterLocations = (
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number,
  activeView: 'certified' | 'calculated'
): SharedAstroSpot[] => {
  if (!locations || locations.length === 0) {
    return [];
  }

  return locations.filter(location => {
    // Skip invalid locations
    if (!location || !location.latitude || !location.longitude) {
      return false;
    }
    
    // Always include certified locations
    const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
    if (isCertified) {
      return true;
    }
    
    // For certified view, only include certified locations
    if (activeView === 'certified') {
      return false;
    }

    // Skip water locations for calculated view
    if (isWaterLocation(location.latitude, location.longitude)) {
      return false;
    }
    
    // Apply radius filtering if we have a user location
    if (userLocation) {
      const distance = location.distance || calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        location.latitude,
        location.longitude
      );
      
      return distance <= searchRadius;
    }
    
    return true;
  });
};

/**
 * Optimize locations for mobile display
 */
export const optimizeLocationsForMobile = (
  locations: SharedAstroSpot[],
  isMobile: boolean,
  activeView: 'certified' | 'calculated'
): SharedAstroSpot[] => {
  if (!isMobile || locations.length <= 30) {
    return locations;
  }
  
  // Always keep certified locations
  const certified = locations.filter(loc => 
    loc.isDarkSkyReserve || loc.certification
  );
  
  // For non-certified locations, if we have too many, sample them
  const nonCertified = locations
    .filter(loc => !loc.isDarkSkyReserve && !loc.certification)
    .filter((_, index) => index % (activeView === 'certified' ? 4 : 2) === 0)
    .slice(0, 50); // Hard limit for performance
  
  return [...certified, ...nonCertified];
};
