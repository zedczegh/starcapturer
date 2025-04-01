/**
 * Utility functions for managing location data in localStorage
 */

// Storage key for latest location
const LATEST_LOCATION_KEY = 'latest_siqs_location';
// Timestamp key for tracking last refresh
const REFRESH_TIMESTAMP_KEY = 'last_refresh_timestamp';

// Validate location data
const isValidLocation = (location: any): boolean => {
  return (
    location &&
    typeof location === 'object' &&
    typeof location.name === 'string' &&
    typeof location.latitude === 'number' && 
    isFinite(location.latitude) &&
    typeof location.longitude === 'number' && 
    isFinite(location.longitude) &&
    location.latitude >= -90 && 
    location.latitude <= 90 &&
    location.longitude >= -180 && 
    location.longitude <= 180
  );
};

// Type definition for location data
export interface SIQSLocation {
  name: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
  timestamp?: string;
  fromPhotoPoints?: boolean;
  lastRefreshed?: string; // Track when location was last refreshed
}

// Save location to localStorage
export const saveLocation = (location: SIQSLocation): boolean => {
  try {
    if (!isValidLocation(location)) {
      console.error("Invalid location data:", location);
      return false;
    }
    
    // Add timestamp if not provided
    const locationWithTimestamp = {
      ...location,
      timestamp: location.timestamp || new Date().toISOString(),
      lastRefreshed: new Date().toISOString() // Always update refresh timestamp
    };
    
    localStorage.setItem(LATEST_LOCATION_KEY, JSON.stringify(locationWithTimestamp));
    return true;
  } catch (error) {
    console.error("Error saving location to localStorage:", error);
    return false;
  }
};

// Get saved location from localStorage
export const getSavedLocation = (): SIQSLocation | null => {
  try {
    const savedLocationString = localStorage.getItem(LATEST_LOCATION_KEY);
    if (!savedLocationString) return null;
    
    const savedLocation = JSON.parse(savedLocationString);
    
    if (isValidLocation(savedLocation)) {
      return savedLocation;
    }
    
    return null;
  } catch (error) {
    console.error("Error retrieving location from localStorage:", error);
    return null;
  }
};

// Save location with flag to indicate it came from PhotoPoints page
export const saveLocationFromPhotoPoints = (locationData: any): void => {
  if (!locationData?.id) return;
  
  try {
    // Make sure we add the fromPhotoPoints flag
    const dataToSave = {
      ...locationData,
      fromPhotoPoints: true,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(`location_${locationData.id}`, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Error saving location with PhotoPoints flag:', error);
  }
};

// Save last refresh time for a location
export const saveRefreshTimestamp = (locationId: string): boolean => {
  try {
    const timestamp = new Date().toISOString();
    localStorage.setItem(`${REFRESH_TIMESTAMP_KEY}_${locationId}`, timestamp);
    return true;
  } catch (error) {
    console.error("Error saving refresh timestamp:", error);
    return false;
  }
};

// Get last refresh time for a location
export const getLastRefreshTimestamp = (locationId: string): string | null => {
  try {
    return localStorage.getItem(`${REFRESH_TIMESTAMP_KEY}_${locationId}`);
  } catch (error) {
    console.error("Error retrieving refresh timestamp:", error);
    return null;
  }
};

// Check if location needs refresh (more than 15 minutes old)
export const needsRefresh = (locationId: string): boolean => {
  const lastRefresh = getLastRefreshTimestamp(locationId);
  if (!lastRefresh) return true;
  
  const lastRefreshDate = new Date(lastRefresh);
  const now = new Date();
  const diffMs = now.getTime() - lastRefreshDate.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  
  return diffMinutes > 15; // Refresh if older than 15 minutes
};

// Clear saved location from localStorage
export const clearSavedLocation = (): boolean => {
  try {
    localStorage.removeItem(LATEST_LOCATION_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing location from localStorage:", error);
    return false;
  }
};

// Check if we have a saved location
export const hasSavedLocation = (): boolean => {
  return getSavedLocation() !== null;
};

// Save location details with ID (used for detailed location info)
export const saveLocationDetails = (id: string, locationData: any): boolean => {
  try {
    if (!id) {
      console.error("Invalid location ID");
      return false;
    }
    
    const key = `location_${id}`;
    locationData.lastRefreshed = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(locationData));
    return true;
  } catch (error) {
    console.error("Error saving location details to localStorage:", error);
    return false;
  }
};

// Get saved location details by ID
export const getLocationDetailsById = (id: string): any | null => {
  try {
    if (!id) return null;
    
    const key = `location_${id}`;
    const storedData = localStorage.getItem(key);
    
    if (!storedData) return null;
    
    return JSON.parse(storedData);
  } catch (error) {
    console.error("Error retrieving location details from localStorage:", error);
    return null;
  }
};
