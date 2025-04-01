/**
 * Functions for managing location data in local storage
 */
import { v4 as uuidv4 } from 'uuid';

export interface SIQSLocation {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  timestamp?: string;
  bortleScale?: number;
  lightPollution?: number;
  placeDetails?: string;
  fromCalculator?: boolean;
  isDarkSkyReserve?: boolean;
  certification?: string;
}

// Load saved location data
export const loadSavedLocation = (): SIQSLocation | null => {
  try {
    const savedData = localStorage.getItem('siqs_last_location');
    if (savedData) {
      return JSON.parse(savedData);
    }
  } catch (error) {
    console.error('Error loading saved location:', error);
  }
  return null;
};

// Save location data to localStorage
export const saveLocation = (location: SIQSLocation): void => {
  try {
    // Generate an ID if one doesn't exist
    if (!location.id) {
      location.id = uuidv4();
    }
    
    // Add timestamp if not present
    if (!location.timestamp) {
      location.timestamp = new Date().toISOString();
    }
    
    // Save to localStorage
    localStorage.setItem('siqs_last_location', JSON.stringify(location));
    
    // Update saved locations list
    addToSavedLocations(location);
  } catch (error) {
    console.error('Error saving location:', error);
  }
};

// Clear saved location data
export const clearSavedLocation = (): void => {
  try {
    localStorage.removeItem('siqs_last_location');
  } catch (error) {
    console.error('Error clearing saved location:', error);
  }
};

// Get list of saved locations
export const getSavedLocations = (): SIQSLocation[] => {
  try {
    const savedLocations = localStorage.getItem('siqs_saved_locations');
    if (savedLocations) {
      return JSON.parse(savedLocations);
    }
  } catch (error) {
    console.error('Error getting saved locations:', error);
  }
  return [];
};

// Add a location to the saved locations list
export const addToSavedLocations = (location: SIQSLocation): void => {
  try {
    const savedLocations = getSavedLocations();
    
    // Check if location already exists by coordinates
    const exists = savedLocations.some(loc => 
      loc.latitude === location.latitude && 
      loc.longitude === location.longitude
    );
    
    // If it doesn't exist, add it to the list
    if (!exists) {
      savedLocations.push(location);
      localStorage.setItem('siqs_saved_locations', JSON.stringify(savedLocations));
    }
  } catch (error) {
    console.error('Error adding to saved locations:', error);
  }
};

// Get location details by ID
export const getLocationDetailsById = (id: string): SIQSLocation | null => {
  try {
    // First check if it's the current location
    const currentLocation = loadSavedLocation();
    if (currentLocation && currentLocation.id === id) {
      return currentLocation;
    }
    
    // Otherwise look through saved locations
    const savedLocations = getSavedLocations();
    const location = savedLocations.find(loc => loc.id === id);
    return location || null;
  } catch (error) {
    console.error('Error getting location by ID:', error);
    return null;
  }
};

// Save location coming from photo points page
export const saveLocationFromPhotoPoints = (locationData: SIQSLocation): void => {
  try {
    // Ensure it has an ID
    if (!locationData.id) {
      locationData.id = uuidv4();
    }
    
    // Ensure it has a timestamp
    if (!locationData.timestamp) {
      locationData.timestamp = new Date().toISOString();
    }
    
    // Add fromPhotoPoints flag
    locationData.fromCalculator = false;
    
    // Save to localStorage
    localStorage.setItem('siqs_last_location', JSON.stringify(locationData));
    
    // Also add to saved locations for history
    addToSavedLocations(locationData);
  } catch (error) {
    console.error('Error saving location from photo points:', error);
  }
};

// Clear all saved location data
export const clearAllLocationData = (): void => {
  try {
    localStorage.removeItem('siqs_last_location');
    localStorage.removeItem('siqs_saved_locations');
  } catch (error) {
    console.error('Error clearing all location data:', error);
  }
};
