
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Prepares a location object for navigation to details page
 * Ensures all required data is present and properly formatted
 * 
 * @param location The location object to prepare
 * @returns A sanitized location object ready for navigation
 */
export function prepareLocationForNavigation(location: SharedAstroSpot) {
  if (!location) return null;
  
  try {
    // Create a unique, stable location ID
    let locationId;
    try {
      locationId = location.id || 
        (location.latitude && location.longitude 
          ? `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`
          : `loc-${Date.now()}`);
    } catch (e) {
      console.error("Error creating locationId:", e);
      locationId = `loc-${Date.now()}`;
    }
      
    // Create a complete state object with all required properties
    const safeLocationState = {
      id: locationId,
      name: location.name || 'Unnamed Location',
      chineseName: location.chineseName || '',
      latitude: location.latitude,
      longitude: location.longitude,
      bortleScale: location.bortleScale || 4,
      siqs: location.siqs || null,
      siqsResult: location.siqs ? { score: location.siqs } : undefined,
      certification: location.certification || '',
      isDarkSkyReserve: !!location.isDarkSkyReserve,
      timestamp: new Date().toISOString(),
      fromPhotoPoints: true
    };
    
    // Validate location has required coordinates
    if (!safeLocationState.latitude || !safeLocationState.longitude) {
      console.error("Invalid location: missing coordinates", location);
      return null;
    }
    
    // Store in localStorage as backup in case state is lost during navigation
    try {
      localStorage.setItem(`location_${locationId}`, JSON.stringify(safeLocationState));
    } catch (error) {
      console.error("Error saving location to localStorage:", error);
      
      // Try again with a smaller object if storage is full
      try {
        const minimalState = {
          id: locationId,
          name: safeLocationState.name,
          latitude: safeLocationState.latitude,
          longitude: safeLocationState.longitude,
          timestamp: safeLocationState.timestamp,
          fromPhotoPoints: true
        };
        localStorage.setItem(`location_${locationId}_minimal`, JSON.stringify(minimalState));
      } catch (e) {
        console.warn("Failed to save even minimal location state");
      }
    }
    
    return {
      locationId,
      locationState: safeLocationState
    };
  } catch (error) {
    console.error("Error in prepareLocationForNavigation:", error);
    return null;
  }
}
