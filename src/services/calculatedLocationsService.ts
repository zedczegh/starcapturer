import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';

// Constants
const STORAGE_KEY = 'calculated_locations';
const MAX_CACHED_LOCATIONS = 1000; // Maximum number of locations to store

/**
 * Adds a location to the calculated locations store
 */
export function addLocationToStore(location: SharedAstroSpot): void {
  try {
    // Skip if location doesn't have coordinates
    if (!location.latitude || !location.longitude) {
      return;
    }
    
    // Get existing locations
    const existingLocations = getLocationsFromStore();
    
    // Create a unique key for this location
    const locationKey = `${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
    
    // Check if this location already exists in the store
    const existingIndex = existingLocations.findIndex(loc => 
      loc.latitude === location.latitude && 
      loc.longitude === location.longitude
    );
    
    if (existingIndex >= 0) {
      // Update existing location
      existingLocations[existingIndex] = {
        ...existingLocations[existingIndex],
        ...location,
        timestamp: location.timestamp || new Date().toISOString()
      };
    } else {
      // Add new location
      existingLocations.push({
        ...location,
        id: location.id || `loc-${locationKey}`,
        timestamp: location.timestamp || new Date().toISOString()
      });
    }
    
    // If we have too many locations, remove oldest ones
    if (existingLocations.length > MAX_CACHED_LOCATIONS) {
      existingLocations.sort((a, b) => {
        return new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime();
      });
      
      // Keep only the most recent MAX_CACHED_LOCATIONS
      existingLocations.splice(MAX_CACHED_LOCATIONS);
    }
    
    // Save updated locations
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingLocations));
    
  } catch (error) {
    console.error('Error adding location to store:', error);
  }
}

/**
 * Retrieves all locations from store
 */
export function getLocationsFromStore(): SharedAstroSpot[] {
  try {
    const locationsJson = localStorage.getItem(STORAGE_KEY);
    return locationsJson ? JSON.parse(locationsJson) : [];
  } catch (error) {
    console.error('Error retrieving locations from store:', error);
    return [];
  }
}

/**
 * Find locations within a specified radius of given coordinates
 */
export function findLocationsInRadius(
  latitude: number, 
  longitude: number, 
  radiusKm: number
): SharedAstroSpot[] {
  try {
    const allLocations = getLocationsFromStore();
    
    // Filter locations within radius
    return allLocations.filter(location => {
      if (!location.latitude || !location.longitude) return false;
      
      const distance = calculateDistance(
        latitude,
        longitude,
        location.latitude,
        location.longitude
      );
      
      return distance <= radiusKm;
    });
    
  } catch (error) {
    console.error('Error finding locations in radius:', error);
    return [];
  }
}

/**
 * Clear all stored locations
 */
export function clearLocationStore(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Cleared location store');
  } catch (error) {
    console.error('Error clearing location store:', error);
  }
}
