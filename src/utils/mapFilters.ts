
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
  
  // Use performance-optimized approach
  const processStart = performance.now();
  
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
  
  // For calculated view, add filtered non-certified locations in batches
  const calculatedMax = 50; // Limit number of calculated locations for performance
  let calculatedCount = 0;
  
  // Process non-certified locations in smaller chunks to prevent UI freezing
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
  
  const results = Array.from(locationMap.values());
  const processEnd = performance.now();
  console.log(`Location filtering completed in ${(processEnd - processStart).toFixed(2)}ms for ${locations.length} locations. Returned ${results.length}.`);
  
  return results;
}
