import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/utils/geoUtils";
import { isWaterLocation } from "@/utils/validation";
import { filterMapLocations } from '@/utils/mapFilters';

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
  
  return filterMapLocations(locations, userLocation, searchRadius, activeView);
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
