
/**
 * Utilities for storing and retrieving location data
 */

// Location interface for consistency
interface StoredLocation {
  name: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
  timestamp?: string;
}

/**
 * Save a location to localStorage
 */
export const saveLocation = (location: StoredLocation): void => {
  if (!location || !location.name) return;
  
  try {
    // Add timestamp if not provided
    const locationWithTimestamp = {
      ...location,
      timestamp: location.timestamp || new Date().toISOString()
    };
    
    localStorage.setItem('latest_siqs_location', JSON.stringify(locationWithTimestamp));
    console.log(`Location saved: ${location.name}`);
  } catch (error) {
    console.error('Failed to save location to localStorage', error);
  }
};

/**
 * Get the saved location from localStorage
 */
export const getSavedLocation = (): StoredLocation | null => {
  try {
    const savedLocation = localStorage.getItem('latest_siqs_location');
    return savedLocation ? JSON.parse(savedLocation) : null;
  } catch (error) {
    console.error('Failed to retrieve location from localStorage', error);
    return null;
  }
};

/**
 * Clear all saved location data
 */
export const clearSavedLocation = (): void => {
  try {
    localStorage.removeItem('latest_siqs_location');
    console.log('Saved location cleared');
  } catch (error) {
    console.error('Failed to clear location from localStorage', error);
  }
};

/**
 * Save location details for a specific ID
 */
export const saveLocationDetails = (id: string, data: any): void => {
  if (!id || !data) return;
  
  try {
    localStorage.setItem(`location_${id}`, JSON.stringify(data));
    console.log(`Location details saved for ID: ${id}`);
  } catch (error) {
    console.error('Failed to save location details to localStorage', error);
  }
};
