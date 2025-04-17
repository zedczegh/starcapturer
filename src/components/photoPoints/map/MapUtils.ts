
import { SharedAstroSpot } from "@/lib/api/astroSpots";

/**
 * Filter locations for map display
 */
export function filterLocations(
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number,
  activeView: 'certified' | 'calculated'
): SharedAstroSpot[] {
  if (!locations || locations.length === 0) return [];
  
  // For certified view, include all certified locations regardless of distance
  if (activeView === 'certified') {
    return locations.filter(loc => 
      Boolean(loc.isDarkSkyReserve || loc.certification)
    );
  }
  
  // For calculated view, filter by distance if user location is available
  if (userLocation) {
    return locations.filter(loc => {
      // Always include certified locations
      if (loc.isDarkSkyReserve || loc.certification) return true;
      
      // Filter regular locations by distance
      return loc.distance !== undefined && loc.distance <= searchRadius;
    });
  }
  
  // If no user location, return all locations for the calculated view
  return locations;
}

/**
 * Optimize locations for mobile display
 */
export function optimizeLocationsForMobile(
  locations: SharedAstroSpot[],
  isMobile: boolean,
  activeView: 'certified' | 'calculated'
): SharedAstroSpot[] {
  if (!isMobile) return locations;
  
  // On mobile, reduce the number of markers to improve performance
  const certifiedLocations = locations.filter(loc => 
    Boolean(loc.isDarkSkyReserve || loc.certification)
  );
  
  const regularLocations = locations.filter(loc => 
    !loc.isDarkSkyReserve && !loc.certification
  );
  
  // Always show all certified locations
  if (activeView === 'certified') return certifiedLocations;
  
  // For calculated view, limit regular locations on mobile
  const mobileLimitRegular = 20;
  const limitedRegular = regularLocations.slice(0, mobileLimitRegular);
  
  return [...certifiedLocations, ...limitedRegular];
}
