
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';

/**
 * Filter visible locations with optimal strategies for different displays
 * 
 * @param locations Array of locations to filter
 * @param userLocation Current user location
 * @param maxLocations Maximum number of locations to show
 * @returns Filtered array of locations
 */
export function filterVisibleLocations(
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  maxLocations: number = 100
): SharedAstroSpot[] {
  if (!locations.length) return [];
  
  // Step 1: Split into certified and non-certified locations
  const certified = locations.filter(loc => 
    loc.isDarkSkyReserve || loc.certification
  );
  
  const nonCertified = locations.filter(loc => 
    !loc.isDarkSkyReserve && !loc.certification
  );
  
  // Step 2: For certified locations, ensure we include ALL of them
  // For non-certified, filter and sort by quality/distance
  
  // Calculate how many non-certified locations we can include
  const nonCertifiedCount = Math.max(0, maxLocations - certified.length);
  
  // For non-certified locations, prefer closer and higher quality spots
  let filteredNonCertified = nonCertified;
  
  if (userLocation) {
    // Ensure distances are calculated
    filteredNonCertified = nonCertified.map(loc => {
      if (loc.distance === undefined) {
        return {
          ...loc,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            loc.latitude,
            loc.longitude
          )
        };
      }
      return loc;
    });
    
    // Sort by combined quality and distance score
    filteredNonCertified = filteredNonCertified.sort((a, b) => {
      const aScore = typeof a.siqs === 'number' ? a.siqs : 0;
      const bScore = typeof b.siqs === 'number' ? b.siqs : 0;
      
      // Higher SIQS and shorter distance is better
      // Weight SIQS more heavily (70%) than distance (30%)
      const aQuality = (aScore * 0.7) - ((a.distance || 0) * 0.3);
      const bQuality = (bScore * 0.7) - ((b.distance || 0) * 0.3);
      
      return bQuality - aQuality;
    });
  }
  
  // Limit non-certified locations to calculated count
  filteredNonCertified = filteredNonCertified.slice(0, nonCertifiedCount);
  
  // Combine certified and filtered non-certified locations
  return [...certified, ...filteredNonCertified];
}

/**
 * Optimize locations for map display on mobile devices
 * 
 * @param locations Array of locations to optimize
 * @param isMobile Whether the device is mobile
 * @param activeView Current active view
 * @returns Optimized array of locations
 */
export function optimizeLocationsForMobile(
  locations: SharedAstroSpot[],
  isMobile: boolean,
  activeView: string
): SharedAstroSpot[] {
  if (!isMobile) return locations;
  
  // On mobile with certified view, show all certified locations
  if (activeView === 'certified') {
    return locations;
  }
  
  // On mobile with calculated view, limit and prioritize
  const certified = locations.filter(loc => 
    loc.isDarkSkyReserve || loc.certification
  );
  
  const nonCertified = locations.filter(loc => 
    !loc.isDarkSkyReserve && !loc.certification
  );
  
  // Limit non-certified locations on mobile for better performance
  const mobileNonCertifiedLimit = 20;
  const limitedNonCertified = nonCertified.slice(0, mobileNonCertifiedLimit);
  
  return [...certified, ...limitedNonCertified];
}
