/**
 * Utility for saving and loading locations to/from localStorage
 */

// Define the type for saved locations
export interface SIQSLocation {
  name: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
  timestamp?: string;
  siqsScore?: number;
}

// Store all saved locations in localStorage
export function saveLocation(location: SIQSLocation): void {
  try {
    // First, save as latest location
    localStorage.setItem('latest_siqs_location', JSON.stringify({
      ...location,
      timestamp: new Date().toISOString()
    }));
    
    // Then add to saved locations list (keeping up to 10 max)
    const savedLocationsJson = localStorage.getItem('saved_siqs_locations');
    let savedLocations: SIQSLocation[] = [];
    
    if (savedLocationsJson) {
      savedLocations = JSON.parse(savedLocationsJson);
    }
    
    // Check if the location already exists (by coordinates)
    const existingIndex = savedLocations.findIndex(
      loc => Math.abs(loc.latitude - location.latitude) < 0.001 && 
             Math.abs(loc.longitude - location.longitude) < 0.001
    );
    
    if (existingIndex >= 0) {
      // Update the existing location
      savedLocations[existingIndex] = {
        ...location,
        timestamp: new Date().toISOString()
      };
    } else {
      // Add new location to the beginning of the array
      savedLocations.unshift({
        ...location,
        timestamp: new Date().toISOString()
      });
      
      // Keep only the most recent 10 locations
      if (savedLocations.length > 10) {
        savedLocations = savedLocations.slice(0, 10);
      }
    }
    
    // Save the updated list
    localStorage.setItem('saved_siqs_locations', JSON.stringify(savedLocations));
  } catch (error) {
    console.error('Error saving location to localStorage:', error);
  }
}

// Get most recently saved location
export function getLatestLocation(): SIQSLocation | null {
  try {
    const locationJson = localStorage.getItem('latest_siqs_location');
    if (locationJson) {
      return JSON.parse(locationJson);
    }
    return null;
  } catch (error) {
    console.error('Error loading latest location from localStorage:', error);
    return null;
  }
}

// Get all saved locations
export function getSavedLocations(): SIQSLocation[] {
  try {
    const locationsJson = localStorage.getItem('saved_siqs_locations');
    if (locationsJson) {
      return JSON.parse(locationsJson);
    }
    return [];
  } catch (error) {
    console.error('Error loading saved locations from localStorage:', error);
    return [];
  }
}

// Clear all saved locations
export function clearSavedLocations(): void {
  try {
    localStorage.removeItem('saved_siqs_locations');
    localStorage.removeItem('latest_siqs_location');
  } catch (error) {
    console.error('Error clearing saved locations from localStorage:', error);
  }
}
