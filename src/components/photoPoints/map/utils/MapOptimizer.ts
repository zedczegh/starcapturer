
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { filterLocations } from "../MapUtils";
import MarkerManager from "./markers/MarkerManager";
import { getSiqsScore } from "@/utils/siqsHelpers";

/**
 * Optimize locations for display on map
 * @param locations Array of locations to optimize
 * @param isMobile Whether the device is mobile
 * @param activeView Current active view
 * @returns Optimized array of locations
 */
export const optimizeLocationsForDisplay = (
  locations: SharedAstroSpot[],
  isMobile: boolean,
  activeView: 'certified' | 'calculated'
): SharedAstroSpot[] => {
  // If not many locations or certified view, return all
  if (locations.length < 500 || activeView === 'certified') {
    return locations;
  }
  
  // For mobile with many locations, prioritize certified and high-quality locations
  if (isMobile) {
    // First, get all certified locations
    const certified = locations.filter(
      loc => loc.isDarkSkyReserve || loc.certification
    );
    
    // Then get high quality calculated locations (SIQS > 5)
    const highQuality = locations.filter(
      loc => !loc.isDarkSkyReserve && !loc.certification && 
             loc.siqs && getSiqsScore(loc.siqs) > 5
    );
    
    // Combine, but limit total number for better performance
    const combined = [...certified, ...highQuality];
    return combined.slice(0, 300); // Hard limit for mobile performance
  }
  
  // For desktop with many locations, still limit but allow more
  return locations.slice(0, 500);
};

/**
 * Initialize marker manager for the map
 */
export const createMarkerManager = (): MarkerManager => {
  return new MarkerManager();
};
