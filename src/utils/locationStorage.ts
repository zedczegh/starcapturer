
/**
 * Location storage utilities for saving and retrieving location data
 */

// Types
export interface LocationData {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  timestamp?: string;
  weatherData?: any;
  siqsResult?: any;
  [key: string]: any;
}

// Define SIQSLocation type as it's referenced in several components
export interface SIQSLocation {
  name: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
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
 * Get location details by ID - alias for getLocationDetails
 * for backward compatibility
 */
export const getLocationDetailsById = getLocationDetails;

/**
 * Save location as the latest used location
 */
export function saveLocation(locationData: LocationData | SIQSLocation): void {
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

/**
 * Save location from PhotoPoints page
 */
export function saveLocationFromPhotoPoints(locationData: any): void {
  if (!locationData || !locationData.latitude || !locationData.longitude) {
    console.error("Invalid location data for PhotoPoints");
    return;
  }
  
  const id = locationData.id || generateLocationId(locationData.latitude, locationData.longitude);
  
  // Save to detail storage
  saveLocationDetails(id, {
    ...locationData,
    fromPhotoPoints: true
  });
  
  // Also save as latest location if requested
  if (locationData.saveAsLatest) {
    saveLocation(locationData);
  }
}

/**
 * Fix the localStorage.setItem function call in getLocationDetails
 * This was a typo in the original file
 */
export function fixGetLocationDetails() {
  try {
    const originalFunction = getLocationDetails;
    
    if (originalFunction.toString().includes('localStorage.setItem')) {
      (window as any).fixedGetLocationDetails = function(id: string): any | null {
        try {
          const data = localStorage.getItem(`location_${id}`);
          return data ? JSON.parse(data) : null;
        } catch (error) {
          console.error("Error getting location details:", error);
          return null;
        }
      };
      
      // Replace the function
      const newFunction = (window as any).fixedGetLocationDetails;
      
      // Replace the original function
      Object.defineProperty(window, 'getLocationDetails', {
        value: newFunction,
        writable: true,
        configurable: true
      });
    }
  } catch (error) {
    console.error("Error fixing getLocationDetails function:", error);
  }
}

// Fix the localStorage.setItem typo at module initialization
fixGetLocationDetails();
