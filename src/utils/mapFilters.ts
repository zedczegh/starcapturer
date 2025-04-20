import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/utils/geoUtils";
import { isWaterLocation } from "@/utils/validation";

/**
 * Core filtering logic for map locations
 * Extracted to improve maintainability and performance
 */
export function filterMapLocations(
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number,
  activeView: 'certified' | 'calculated'
): SharedAstroSpot[] {
  // Create a Map for faster lookups and deduplication
  const locationMap = new Map<string, SharedAstroSpot>();
  
  // Process certified locations first (always shown regardless of view)
  const certifiedLocations: SharedAstroSpot[] = [];
  const certifiedCoordinates = new Set<string>();
  
  // First pass: collect all certified locations
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
  // Increased limit for calculated locations to make them more visible
  const calculatedMax = 100; // Increased from 50 to show more calculated spots
  let calculatedCount = 0;
  
  // Sort non-certified locations by quality first (higher SIQS first)
  const nonCertifiedLocations = locations
    .filter(loc => !(loc.certification || loc.isDarkSkyReserve))
    .filter(loc => loc.latitude && loc.longitude) // Ensure valid coordinates
    .sort((a, b) => {
      // Get SIQS scores
      const scoreA = typeof a.siqs === 'object' ? a.siqs.score : (a.siqs || 0);
      const scoreB = typeof b.siqs === 'object' ? b.siqs.score : (b.siqs || 0);
      
      return scoreB - scoreA; // Higher scores first
    });
  
  // Process sorted non-certified locations
  for (let i = 0; i < nonCertifiedLocations.length && calculatedCount < calculatedMax; i++) {
    const loc = nonCertifiedLocations[i];
    
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
  
  // Return combined results
  return Array.from(locationMap.values());
}

/**
 * Optimize locations for different device types
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
    const desktopCalculatedLimit = 150; // Increased from 100 to show more spots
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
  
  // Increase limit for mobile
  const mobileCalculatedLimit = 50; // Increased from 30 to show more spots
  const limitedCalculated = calculatedLocations.slice(0, mobileCalculatedLimit);
  
  // Return all certified locations plus the limited calculated ones
  return [...certifiedLocations, ...limitedCalculated];
}
