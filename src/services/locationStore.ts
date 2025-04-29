
import { SharedAstroSpot } from '@/types/weather';

// In-memory store for locations
const locationStore: Map<string, SharedAstroSpot> = new Map();

/**
 * Add a location to the store
 * @param location The location to add
 */
export function addLocationToStore(location: SharedAstroSpot): void {
  // Use ID if available, otherwise create a coordinate-based key
  const key = location.id || `${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
  locationStore.set(key, location);
}

/**
 * Get a location from the store by ID
 * @param id The ID of the location to retrieve
 */
export function getLocationFromStore(id: string): SharedAstroSpot | undefined {
  return locationStore.get(id);
}

/**
 * Get all locations from the store
 */
export function getAllLocationsFromStore(): SharedAstroSpot[] {
  return Array.from(locationStore.values());
}

/**
 * Clear the location store
 */
export function clearLocationStore(): void {
  locationStore.clear();
}
