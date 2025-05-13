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
  if (!locationData?.id) {
    console.error("Cannot save location without ID", locationData);
    return;
  }
  
  try {
    // Make sure we add the fromPhotoPoints flag
    const dataToSave = {
      ...locationData,
      fromPhotoPoints: true,
      timestamp: locationData.timestamp || new Date().toISOString()
    };
    
    // Create a backup of the data in case localStorage limit is reached
    const backupKey = `backup_location_${locationData.id}`;
    try {
      localStorage.setItem(backupKey, JSON.stringify({
        name: dataToSave.name,
        latitude: dataToSave.latitude,
        longitude: dataToSave.longitude,
        bortleScale: dataToSave.bortleScale || 4,
        siqs: dataToSave.siqs,
        timestamp: dataToSave.timestamp,
        fromPhotoPoints: true
      }));
    } catch (e) {
      console.warn("Failed to save location backup", e);
    }
    
    // Try to save the full data
    try {
      localStorage.setItem(`location_${locationData.id}`, JSON.stringify(dataToSave));
      console.log(`Location saved to storage with ID: ${locationData.id}`);
    } catch (storageError) {
      // If storage is full, try to save a minimal version
      console.warn("Storage error, falling back to minimal location data", storageError);
      
      // Clear non-essential data from localStorage to make space
      try {
        clearOldLocationData();
        
        // Try again with minimal data
        const minimalData = {
          id: dataToSave.id,
          name: dataToSave.name,
          latitude: dataToSave.latitude,
          longitude: dataToSave.longitude,
          bortleScale: dataToSave.bortleScale || 4,
          fromPhotoPoints: true,
          timestamp: dataToSave.timestamp
        };
        
        localStorage.setItem(`location_${locationData.id}`, JSON.stringify(minimalData));
      } catch (e) {
        console.error("Failed to save even minimal location data", e);
      }
    }
  } catch (error) {
    console.error('Error saving location with PhotoPoints flag:', error);
  }
};

// Helper function to clear old location data when storage is full
function clearOldLocationData(): void {
  try {
    // Find keys that start with 'location_' but aren't the most recent ones
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('location_') && !key.includes('latest')) {
        keysToRemove.push(key);
      }
    }
    
    // Sort by timestamp if available
    const keyTimestamps = keysToRemove.map(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        return {
          key,
          timestamp: data.timestamp ? new Date(data.timestamp).getTime() : 0
        };
      } catch (e) {
        return { key, timestamp: 0 };
      }
    });
    
    // Keep only the 5 most recent items
    keyTimestamps.sort((a, b) => b.timestamp - a.timestamp);
    const keysToKeep = keyTimestamps.slice(0, 5).map(item => item.key);
    
    // Remove old items
    keysToRemove
      .filter(key => !keysToKeep.includes(key))
      .forEach(key => localStorage.removeItem(key));
  } catch (e) {
    console.error("Error cleaning up old location data", e);
  }
}

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

// Rename getLocationDetails to getLocationDetailsById for compatibility
export const getLocationDetailsById = (id: string): any | null => {
  try {
    if (!id) return null;
    
    const key = `location_${id}`;
    const storedData = localStorage.getItem(key);
    
    if (!storedData) {
      // Try to load from backup
      const backupKey = `backup_location_${id}`;
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        console.log("Using backup location data for ID:", id);
        return JSON.parse(backupData);
      }
      return null;
    }
    
    return JSON.parse(storedData);
  } catch (error) {
    console.error("Error retrieving location details from localStorage:", error);
    return null;
  }
};

// Keep the old function name for backwards compatibility
export const getLocationDetails = getLocationDetailsById;
