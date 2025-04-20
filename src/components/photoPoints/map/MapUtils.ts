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
  
  // OPTIMIZATION: First process all certified locations separately using Set for faster lookup
  const certifiedCoordinates = new Set<string>();
  const certifiedLocations: SharedAstroSpot[] = [];
  
  // Process certified locations first (always shown regardless of view)
  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    if ((loc.certification || loc.isDarkSkyReserve) && loc.latitude && loc.longitude) {
      const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
      if (!certifiedCoordinates.has(key)) {
        certifiedCoordinates.add(key);
        certifiedLocations.push(loc);
        locationMap.set(key, loc);
      }
    }
  }
  
  // For certified view, return all certified locations without further filtering
  if (activeView === 'certified') {
    return certifiedLocations;
  }
  
  // For calculated view, add filtered non-certified locations
  const calculatedMax = 50; // Limit number of calculated locations for performance
  let calculatedCount = 0;
  
  for (let i = 0; i < locations.length && calculatedCount < calculatedMax; i++) {
    const loc = locations[i];
    // Skip certified locations (already processed)
    if (loc.certification || loc.isDarkSkyReserve) continue;
    
    // Skip invalid locations
    if (!loc.latitude || !loc.longitude) continue;
    
    // Skip water locations
    if (isWaterLocation(loc.latitude, loc.longitude)) continue;
    
    // Filter by distance if user location is available
    if (userLocation) {
      const distance = loc.distance || calculateDistance(
        userLocation.latitude, 
        userLocation.longitude,
        loc.latitude,
        loc.longitude
      );
      
      if (distance > searchRadius) continue; // Skip locations too far away
    }
    
    // Add to map if not already present
    const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
    if (!locationMap.has(key)) {
      locationMap.set(key, loc);
      calculatedCount++;
    }
  }
  
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
  if (!isMobile) {
    // For desktop, still limit total locations for performance but keep more
    const certifiedLocations = locations.filter(loc => 
      Boolean(loc.certification || loc.isDarkSkyReserve)
    );
    
    if (activeView === 'certified') {
      return certifiedLocations;
    }
    
    const calculatedLocations = locations.filter(loc => 
      !loc.certification && !loc.isDarkSkyReserve
    );
    
    // Higher limit for desktop
    const desktopCalculatedLimit = 100;
    const limitedCalculated = calculatedLocations.slice(0, desktopCalculatedLimit);
    
    return [...certifiedLocations, ...limitedCalculated];
  }
  
  // For mobile devices
  const certifiedLocations = locations.filter(loc => 
    Boolean(loc.certification || loc.isDarkSkyReserve)
  );
  
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
