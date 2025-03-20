
/**
 * Utilities for saving and retrieving location data to/from localStorage
 */

interface SavedLocation {
  name: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
  timestamp?: string;
}

const LOCATION_STORAGE_KEY = 'latest_siqs_location';

/**
 * Save location data to localStorage
 * @param location Location data to save
 */
export function saveLocation(location: SavedLocation): void {
  try {
    const locationData = {
      ...location,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));
  } catch (error) {
    console.error("Error saving location to localStorage:", error);
  }
}

/**
 * Get the saved location from localStorage
 * @returns Saved location or null if not found
 */
export function getSavedLocation(): SavedLocation | null {
  try {
    const savedData = localStorage.getItem(LOCATION_STORAGE_KEY);
    
    if (!savedData) return null;
    
    const parsedData = JSON.parse(savedData);
    
    // Validate required fields
    if (!parsedData.name || typeof parsedData.latitude !== 'number' || typeof parsedData.longitude !== 'number') {
      console.warn("Invalid saved location data:", parsedData);
      return null;
    }
    
    return parsedData;
  } catch (error) {
    console.error("Error retrieving location from localStorage:", error);
    return null;
  }
}

/**
 * Clear saved location from localStorage
 */
export function clearSavedLocation(): void {
  try {
    localStorage.removeItem(LOCATION_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing location from localStorage:", error);
  }
}

/**
 * Save a location to the user's favorite locations
 * @param location Location to save
 */
export function saveFavoriteLocation(location: SavedLocation): void {
  try {
    // Get existing favorites
    const favoritesJson = localStorage.getItem('favorite_locations') || '[]';
    const favorites = JSON.parse(favoritesJson);
    
    // Check if location already exists
    const existingIndex = favorites.findIndex((loc: SavedLocation) => 
      loc.latitude === location.latitude && 
      loc.longitude === location.longitude
    );
    
    // Update or add location
    const locationWithTimestamp = {
      ...location,
      timestamp: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      favorites[existingIndex] = locationWithTimestamp;
    } else {
      favorites.push(locationWithTimestamp);
    }
    
    // Save updated list
    localStorage.setItem('favorite_locations', JSON.stringify(favorites));
  } catch (error) {
    console.error("Error saving favorite location:", error);
  }
}

/**
 * Get all favorite locations
 * @returns Array of favorite locations
 */
export function getFavoriteLocations(): SavedLocation[] {
  try {
    const favoritesJson = localStorage.getItem('favorite_locations') || '[]';
    return JSON.parse(favoritesJson);
  } catch (error) {
    console.error("Error retrieving favorite locations:", error);
    return [];
  }
}
