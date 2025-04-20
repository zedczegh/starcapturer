
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/utils/geoUtils";
import { isWaterLocation } from "@/utils/validation";
import { filterMapLocations } from '@/utils/mapFilters';
import { optimizeLocationsForMobile as optimizeForMobile } from '@/utils/filterUtils';

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
  return optimizeForMobile(locations, isMobile, activeView);
}

/**
 * Create a spatial index of locations to improve lookup performance
 * Helps with faster filtering and hover detection
 */
export function createLocationSpatialIndex(locations: SharedAstroSpot[]): Map<string, SharedAstroSpot> {
  const locationMap = new Map<string, SharedAstroSpot>();
  
  if (!locations || !Array.isArray(locations)) return locationMap;
  
  for (const location of locations) {
    if (location.latitude && location.longitude) {
      const key = `${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
      locationMap.set(key, location);
    }
  }
  
  return locationMap;
}
