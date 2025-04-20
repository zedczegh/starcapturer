
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/utils/geoUtils";
import { isWaterLocation } from "@/utils/validation";

/**
 * Filter locations based on map view parameters
 */
export function filterLocations(
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number,
  activeView: 'certified' | 'calculated'
): SharedAstroSpot[] {
  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    return [];
  }
  
  // First, ensure we have all certified locations separately
  const certifiedLocations = locations.filter(loc => 
    Boolean(loc.certification || loc.isDarkSkyReserve)
  );
  
  // For certified view, just return certified locations without any filtering
  if (activeView === 'certified') {
    return certifiedLocations;
  }
  
  // For calculated view, filter non-certified locations
  const calculatedLocations = locations.filter(loc => 
    !loc.certification && !loc.isDarkSkyReserve
  );
  
  const filteredCalculated = calculatedLocations.filter(loc => {
    // Filter out invalid locations
    if (!loc.latitude || !loc.longitude) return false;
    
    // Filter out water locations
    if (isWaterLocation(loc.latitude, loc.longitude)) return false;
    
    // Filter by distance if user location is available
    if (userLocation) {
      const distance = loc.distance || calculateDistance(
        userLocation.latitude, 
        userLocation.longitude,
        loc.latitude,
        loc.longitude
      );
      
      return distance <= searchRadius;
    }
    
    return true;
  });
  
  // ALWAYS include certified locations first, then add filtered calculated locations
  return [...certifiedLocations, ...filteredCalculated];
}

/**
 * Optimize locations for mobile display to prevent performance issues
 */
export function optimizeLocationsForMobile(
  locations: SharedAstroSpot[],
  isMobile: boolean, 
  activeView: string
): SharedAstroSpot[] {
  if (!isMobile) return locations;
  
  // Always include all certified locations regardless of device
  const certifiedLocations = locations.filter(loc => 
    Boolean(loc.certification || loc.isDarkSkyReserve)
  );
  
  // For certified view on mobile, return all certified locations
  if (activeView === 'certified') {
    return certifiedLocations;
  }
  
  // For calculated view on mobile, limit non-certified locations for better performance
  const calculatedLocations = locations.filter(loc => 
    !loc.certification && !loc.isDarkSkyReserve
  );
  
  // Limit calculated locations on mobile for performance
  const mobileCalculatedLimit = 20;
  const limitedCalculated = calculatedLocations.slice(0, mobileCalculatedLimit);
  
  // Return all certified locations plus the limited calculated ones
  return [...certifiedLocations, ...limitedCalculated];
}
