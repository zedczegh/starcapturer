
import { SharedAstroSpot } from '@/types/weather';
import { isWaterLocation } from '@/utils/validation';
import { calculateDistance } from '@/utils/geoUtils';

/**
 * Filter locations based on user location and view type
 * @param locations Array of locations to filter
 * @param userLocation Current user location
 * @param searchRadius Search radius in km
 * @param activeView Current view mode
 * @returns Filtered array of locations
 */
export function filterLocations(
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number,
  activeView: 'certified' | 'calculated'
): SharedAstroSpot[] {
  if (!Array.isArray(locations)) return [];
  
  return locations.filter(location => {
    // Skip invalid locations
    if (!location.latitude || !location.longitude) return false;
    
    // Always include certified locations
    if (location.isDarkSkyReserve || location.certification) return true;
    
    // For calculated locations, apply distance filter if user location is available
    if (activeView === 'calculated' && userLocation) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        location.latitude,
        location.longitude
      );
      
      // Include locations within search radius or with existing distance property
      if (distance <= searchRadius || 
         (typeof location.distance === 'number' && location.distance <= searchRadius)) {
        return !isWaterLocation(location.latitude, location.longitude);
      }
      return false;
    }
    
    return true;
  });
}

/**
 * Optimize the number of displayed locations for mobile devices
 * @param locations Array of locations to optimize
 * @param isMobile Whether we're on a mobile device
 * @param activeView Current view mode
 * @returns Optimized array of locations
 */
export function optimizeLocationsForMobile(
  locations: SharedAstroSpot[],
  isMobile: boolean,
  activeView: 'certified' | 'calculated'
): SharedAstroSpot[] {
  if (!isMobile || locations.length <= 30) return locations;
  
  // For mobile, limit number of displayed locations
  const certifiedLocations = locations.filter(
    loc => loc.isDarkSkyReserve || loc.certification
  );
  
  const calculatedLocations = locations.filter(
    loc => !loc.isDarkSkyReserve && !loc.certification
  );
  
  // Always show all certified locations
  if (activeView === 'certified') return certifiedLocations;
  
  // For calculated view, combine all certified with limited calculated
  const maxCalculated = Math.max(20, 30 - certifiedLocations.length);
  const limitedCalculated = calculatedLocations
    .sort((a, b) => (a.distance || 999) - (b.distance || 999))
    .slice(0, maxCalculated);
  
  return [...certifiedLocations, ...limitedCalculated];
}
