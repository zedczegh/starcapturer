
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/utils/geoUtils";
import { isWaterLocation } from "@/utils/validation";

/**
 * Filter locations based on map view parameters
 * Optimized to prioritize performance and prevent freezing
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
  
  // Create a Map for faster lookups and deduplication
  const locationMap = new Map<string, SharedAstroSpot>();
  
  // First, process all certified locations separately (they should always be shown)
  locations.forEach(loc => {
    if ((loc.certification || loc.isDarkSkyReserve) && loc.latitude && loc.longitude) {
      const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
      locationMap.set(key, loc);
    }
  });
  
  // For certified view, return all certified locations without further filtering
  if (activeView === 'certified') {
    return Array.from(locationMap.values());
  }
  
  // For calculated view, add filtered non-certified locations
  locations.forEach(loc => {
    // Skip certified locations (already processed)
    if (loc.certification || loc.isDarkSkyReserve) return;
    
    // Skip invalid locations
    if (!loc.latitude || !loc.longitude) return;
    
    // Skip water locations
    if (isWaterLocation(loc.latitude, loc.longitude)) return;
    
    // Filter by distance if user location is available
    if (userLocation) {
      const distance = loc.distance || calculateDistance(
        userLocation.latitude, 
        userLocation.longitude,
        loc.latitude,
        loc.longitude
      );
      
      if (distance > searchRadius) return; // Skip locations too far away
    }
    
    // Add to map
    const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
    locationMap.set(key, loc);
  });
  
  return Array.from(locationMap.values());
}

/**
 * Optimize locations for mobile display to prevent performance issues
 * Ensures certified locations are always included
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
  
  // For calculated view on mobile, use more locations but still limit for performance
  const calculatedLocations = locations.filter(loc => 
    !loc.certification && !loc.isDarkSkyReserve
  );
  
  // Increase limit for mobile to prevent emptiness but maintain performance
  const mobileCalculatedLimit = 30;
  const limitedCalculated = calculatedLocations.slice(0, mobileCalculatedLimit);
  
  // Return all certified locations plus the limited calculated ones
  return [...certifiedLocations, ...limitedCalculated];
}
