// Add the necessary import at the top of the file
import { getSiqsScore } from '@/utils/siqsHelpers';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Utility functions for managing map markers and related calculations
 */

/**
 * Calculate the center of a set of locations
 * @param locations Array of SharedAstroSpot locations
 * @returns [latitude, longitude] of the center
 */
export const calculateCenter = (locations: SharedAstroSpot[]): [number, number] => {
  if (!locations || locations.length === 0) {
    return [0, 0];
  }
  
  let sumLat = 0;
  let sumLng = 0;
  
  for (const loc of locations) {
    sumLat += loc.latitude || 0;
    sumLng += loc.longitude || 0;
  }
  
  const avgLat = sumLat / locations.length;
  const avgLng = sumLng / locations.length;
  
  return [avgLat, avgLng];
};

/**
 * Calculate the bounds of a set of locations
 * @param locations Array of SharedAstroSpot locations
 * @returns [[southWestLat, southWestLng], [northEastLat, northEastLng]] bounds
 */
export const calculateBounds = (locations: SharedAstroSpot[]): [[number, number], [number, number]] | null => {
  if (!locations || locations.length === 0) {
    return null;
  }
  
  let minLat = locations[0].latitude || 0;
  let maxLat = locations[0].latitude || 0;
  let minLng = locations[0].longitude || 0;
  let maxLng = locations[0].longitude || 0;
  
  for (const loc of locations) {
    minLat = Math.min(minLat, loc.latitude || 0);
    maxLat = Math.max(maxLat, loc.latitude || 0);
    minLng = Math.min(minLng, loc.longitude || 0);
    maxLng = Math.max(maxLng, loc.longitude || 0);
  }
  
  return [[minLat, minLng], [maxLat, maxLng]];
};

/**
 * Get the ideal zoom level to fit all locations within the map view
 * @param mapRef React ref to the Leaflet map instance
 * @param locations Array of SharedAstroSpot locations
 * @returns Zoom level that fits all locations
 */
export const getZoomLevel = (mapRef: any, locations: SharedAstroSpot[]): number => {
  if (!mapRef || !mapRef.current || !locations || locations.length === 0) {
    return 5;
  }
  
  try {
    const bounds = calculateBounds(locations);
    if (!bounds) return 5;
    
    return mapRef.current.getBoundsZoom(bounds);
  } catch (error) {
    console.error("Error calculating zoom level:", error);
    return 5;
  }
};

/**
 * Get the initial map center based on user location or calculated center
 * @param userLocation User's location { latitude, longitude }
 * @param calculatedCenter Calculated center of locations [latitude, longitude]
 * @returns [latitude, longitude] for initial map center
 */
export const getInitialMapCenter = (
  userLocation: { latitude: number; longitude: number } | null,
  calculatedCenter: [number, number]
): [number, number] => {
  if (userLocation) {
    return [userLocation.latitude, userLocation.longitude];
  }
  
  return calculatedCenter;
};

/**
 * Get the initial zoom level based on whether user location is available
 * @param userLocation User's location { latitude, longitude }
 * @param zoomLevel Calculated zoom level to fit all locations
 * @returns Initial zoom level for the map
 */
export const getInitialZoom = (
  userLocation: { latitude: number; longitude: number } | null,
  zoomLevel: number
): number => {
  return userLocation ? 9 : zoomLevel;
};

/**
 * Get the appropriate map container height based on screen size
 * @param isMobile Boolean indicating if the screen is mobile-sized
 * @returns String representing the map container height
 */
export const getMapContainerHeight = (isMobile: boolean): string => {
  return isMobile ? '40vh' : '50vh';
};

/**
 * Get the location ID for a given SharedAstroSpot
 * @param location SharedAstroSpot object
 * @returns String representing the location ID
 */
export const getLocationId = (location: SharedAstroSpot): string => {
  if (!location || !location.latitude || !location.longitude) return 'no-location';
  return location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
};

/**
 * Get the maximum SIQS score from a list of locations
 */
export const getMaxSiqsScore = (locations: SharedAstroSpot[]): number => {
  let maxSiqs = 0;
  
  for (const location of locations) {
    const siqs = getSiqsScore(location.siqs);
    if (siqs > maxSiqs) {
      maxSiqs = siqs;
    }
  }
  
  return maxSiqs;
};
