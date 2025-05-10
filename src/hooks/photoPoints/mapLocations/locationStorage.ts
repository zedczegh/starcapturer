
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Save locations to session storage for persistence
 */
export const saveLocationsToStorage = (
  locations: SharedAstroSpot[], 
  activeView: 'certified' | 'calculated'
): void => {
  try {
    const storageKey = activeView === 'calculated' ? 
      'persistent_calculated_locations' : 
      'persistent_certified_locations';
    
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
        console.log(`Combined with existing storage: now ${combinedLocations.length} locations`);
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
    console.log(`Stored ${simplifiedLocations.length} locations in session storage under ${storageKey}`);
  } catch (err) {
    console.error('Error storing locations in session storage:', err);
  }
};

/**
 * Load locations from session storage
 */
export const loadLocationsFromStorage = (
  activeView: 'certified' | 'calculated'
): SharedAstroSpot[] => {
  try {
    const persistedKey = activeView === 'certified' ? 
      'persistent_certified_locations' : 
      'persistent_calculated_locations';
    const persistedData = sessionStorage.getItem(persistedKey);
    
    if (persistedData) {
      const persistedLocations = JSON.parse(persistedData);
      if (Array.isArray(persistedLocations)) {
        console.log(`Loaded ${persistedLocations.length} persisted locations from session storage`);
        return persistedLocations;
      }
    }
    return [];
  } catch (error) {
    console.error("Error loading persisted locations:", error);
    return [];
  }
};
