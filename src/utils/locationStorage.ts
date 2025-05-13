
/**
 * Location storage utilities for saving and retrieving location data
 */

// Types
interface LocationData {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  timestamp?: string;
  weatherData?: any;
  siqsResult?: any;
  [key: string]: any;
}

const LOCATION_STORAGE_KEY = 'latest_siqs_location';

/**
 * Save location details to localStorage
 */
export function saveLocationDetails(id: string, data: any): void {
  try {
    const currentTimestamp = new Date().toISOString();
    const locationData = {
      ...data,
      id: id || `loc-${data.latitude}-${data.longitude}`,
      timestamp: data.timestamp || currentTimestamp
    };
    
    localStorage.setItem(`location_${id}`, JSON.stringify(locationData));
    
    // Also save as the latest location if requested
    if (data.saveAsLatest) {
      saveLocation(locationData);
    }
  } catch (error) {
    console.error("Error saving location details:", error);
  }
}

/**
 * Get location details from localStorage
 */
export function getLocationDetails(id: string): any | null {
  try {
    const data = localStorage.getItem(`location_${id}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting location details:", error);
    return null;
  }
}

/**
 * Save location as the latest used location
 */
export function saveLocation(locationData: LocationData): void {
  try {
    // Ensure we have required fields
    if (!locationData.latitude || !locationData.longitude) {
      console.error("Invalid location data: missing latitude or longitude");
      return;
    }
    
    // Add timestamp if not present
    const dataToSave = {
      ...locationData,
      timestamp: locationData.timestamp || new Date().toISOString()
    };
    
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error("Error saving location:", error);
  }
}

/**
 * Get the saved location data
 */
export function getSavedLocation(): LocationData | null {
  try {
    const data = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!data) return null;
    
    const parsedData = JSON.parse(data);
    
    // Validate the data
    if (!parsedData || !parsedData.latitude || !parsedData.longitude) {
      return null;
    }
    
    // Add id if not present
    if (!parsedData.id) {
      parsedData.id = `loc-${parsedData.latitude}-${parsedData.longitude}`;
    }
    
    return parsedData;
  } catch (error) {
    console.error("Error getting saved location:", error);
    return null;
  }
}

/**
 * Generate a location ID from coordinates
 */
export function generateLocationId(latitude: number, longitude: number): string {
  return `loc-${latitude.toFixed(6)}-${longitude.toFixed(6)}`;
}
