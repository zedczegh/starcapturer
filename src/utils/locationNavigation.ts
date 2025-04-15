
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { saveLocationFromPhotoPoints } from "@/utils/locationStorage";

/**
 * Prepare location data for navigation to ensure consistent state objects
 * @param location Location data to prepare
 * @returns Consistent location ID and state object for navigation
 */
export function prepareLocationForNavigation(location: SharedAstroSpot) {
  if (!location || !location.latitude || !location.longitude) {
    console.error("Cannot navigate with invalid location data", location);
    return null;
  }
  
  // Generate a consistent ID for the location
  const locationId = location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
  
  // Create a robust location data object with all necessary fields
  const locationData = {
    id: locationId,
    name: location.name || 'Unnamed Location',
    chineseName: location.chineseName || '',
    latitude: location.latitude,
    longitude: location.longitude,
    bortleScale: location.bortleScale || 4,
    siqs: location.siqs,
    timestamp: new Date().toISOString(),
    fromPhotoPoints: true,
    isDarkSkyReserve: Boolean(location.isDarkSkyReserve),
    certification: location.certification || '',
    // Important: Create a stable siqsResult structure if we have a siqs score
    siqsResult: location.siqs ? { 
      score: location.siqs,
      isViable: location.siqs >= 2,
      factors: location.siqsFactors || []
    } : undefined
  };
  
  // Save location data to localStorage for better state persistence
  saveLocationFromPhotoPoints(locationData);
  
  return {
    locationId,
    locationState: locationData
  };
}

/**
 * Extract valid SIQS data from potentially inconsistent sources
 * @param siqsData Raw SIQS data that might be inconsistent
 * @returns Normalized SIQS data structure
 */
export function normalizeSiqsData(siqsData: any) {
  if (!siqsData) return null;
  
  // Handle case where siqsData is just a number
  if (typeof siqsData === 'number') {
    return {
      score: siqsData,
      isViable: siqsData >= 2,
      factors: []
    };
  }
  
  // Handle case where siqsData is an object with a score property
  if (typeof siqsData === 'object' && siqsData.score !== undefined) {
    return {
      score: siqsData.score,
      isViable: siqsData.isViable !== undefined ? siqsData.isViable : (siqsData.score >= 2),
      factors: Array.isArray(siqsData.factors) ? siqsData.factors : []
    };
  }
  
  // Handle case where siqsData has a siqsResult property
  if (typeof siqsData === 'object' && siqsData.siqsResult) {
    return normalizeSiqsData(siqsData.siqsResult);
  }
  
  return null;
}
