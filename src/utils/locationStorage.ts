
/**
 * Utility functions for managing location data in localStorage
 */

// Save location to localStorage
export const saveLocation = (location: {
  name: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
}) => {
  try {
    localStorage.setItem('latest_siqs_location', JSON.stringify(location));
    return true;
  } catch (error) {
    console.error("Error saving location to localStorage:", error);
    return false;
  }
};

// Get saved location from localStorage
export const getSavedLocation = () => {
  try {
    const savedLocationString = localStorage.getItem('latest_siqs_location');
    if (!savedLocationString) return null;
    
    const savedLocation = JSON.parse(savedLocationString);
    
    // Validate the location data
    if (
      savedLocation && 
      typeof savedLocation.name === 'string' &&
      typeof savedLocation.latitude === 'number' &&
      typeof savedLocation.longitude === 'number'
    ) {
      return savedLocation;
    }
    
    return null;
  } catch (error) {
    console.error("Error retrieving location from localStorage:", error);
    return null;
  }
};

// Clear saved location from localStorage
export const clearSavedLocation = () => {
  try {
    localStorage.removeItem('latest_siqs_location');
    return true;
  } catch (error) {
    console.error("Error clearing location from localStorage:", error);
    return false;
  }
};

// Check if we have a saved location
export const hasSavedLocation = () => {
  return getSavedLocation() !== null;
};
