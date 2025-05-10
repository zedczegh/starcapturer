import { calculateDistance } from '@/utils/geoUtils';
import { validateLocationWithReverseGeocoding } from '@/utils/location/reverseGeocodingValidator';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Helper functions for processing location data on maps
 */

/**
 * Save locations to session storage for persistence
 */
export const persistLocationsToStorage = (
  locations: SharedAstroSpot[],
  storageKey: string
): void => {
  try {
    // Load existing data to merge with
    const existingData = sessionStorage.getItem(storageKey);
    let combinedLocations = [...locations];
    
    if (existingData) {
      try {
        const existingLocations = JSON.parse(existingData);
        
        // Use a Map to deduplicate by coordinates
        const tempMap = new Map<string, SharedAstroSpot>();
        
        // Add existing locations first
        if (Array.isArray(existingLocations)) {
          existingLocations.forEach(loc => {
            if (loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
              const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
              tempMap.set(key, loc);
            }
          });
        }
        
        // Add new locations, overriding existing ones with same coordinates
        locations.forEach(loc => {
          if (loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
            const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
            tempMap.set(key, loc);
          }
        });
        
        // Convert back to array
        combinedLocations = Array.from(tempMap.values());
      } catch (error) {
        console.error("Error parsing existing stored locations:", error);
        // Fallback to just using new locations
      }
    }
    
    // Store the combined data
    const simplifiedLocations = combinedLocations.map(loc => ({
      id: loc.id || `loc-${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`,
      name: loc.name || 'Unknown Location',
      latitude: loc.latitude,
      longitude: loc.longitude,
      siqs: loc.siqs,
      isDarkSkyReserve: loc.isDarkSkyReserve,
      certification: loc.certification,
      distance: loc.distance
    }));
    
    sessionStorage.setItem(storageKey, JSON.stringify(simplifiedLocations));
  } catch (err) {
    console.error('Error storing locations in session storage:', err);
  }
};

/**
 * Filter locations by distance from a reference point
 */
export const filterLocationsByDistance = (
  locations: SharedAstroSpot[],
  referencePoint: { latitude: number; longitude: number } | null,
  searchRadius: number
): SharedAstroSpot[] => {
  if (!referencePoint) return locations;
  
  return locations.filter(loc => {
    // Always include certified locations regardless of distance
    if (loc.isDarkSkyReserve || loc.certification) return true;
    
    const distance = calculateDistance(
      referencePoint.latitude,
      referencePoint.longitude,
      loc.latitude,
      loc.longitude
    );
    
    return distance <= searchRadius;
  });
};

/**
 * Process locations with water filtering
 */
export const filterWaterLocations = async (
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> => {
  // Apply water filtering using reverse geocoding for non-certified locations
  const filteredResults = await Promise.all(
    locations.map(async (loc) => {
      // Skip certified locations
      if (loc.isDarkSkyReserve || loc.certification) return loc;
      
      // Check if it's a water location using geocoding validation
      try {
        const isValid = await validateLocationWithReverseGeocoding(loc);
        // Return null for water locations (will be filtered out)
        return isValid ? loc : null;
      } catch (error) {
        console.warn("Error validating location:", error);
        // If validation fails, keep the location
        return loc;
      }
    })
  );
  
  // Filter out null values (water locations)
  return filteredResults.filter(loc => loc !== null) as SharedAstroSpot[];
};

/**
 * Load and restore persisted locations from session storage
 */
export const loadPersistedLocations = (
  locationsMap: Map<string, SharedAstroSpot>, 
  activeView: string
): Map<string, SharedAstroSpot> => {
  try {
    const persistedKey = activeView === 'certified' ? 
      'persistent_certified_locations' : 
      'persistent_calculated_locations';
    const persistedData = sessionStorage.getItem(persistedKey);
    
    if (persistedData) {
      const persistedLocations = JSON.parse(persistedData);
      if (Array.isArray(persistedLocations)) {
        persistedLocations.forEach(loc => {
          if (loc.latitude && loc.longitude) {
            const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
            if (!locationsMap.has(key)) {
              // For calculated view, add all persisted calculated locations
              if (activeView === 'calculated' || (loc.isDarkSkyReserve || loc.certification)) {
                locationsMap.set(key, loc);
              }
            }
          }
        });
      }
    }
    return locationsMap;
  } catch (error) {
    console.error("Error loading persisted locations:", error);
    return locationsMap;
  }
};
