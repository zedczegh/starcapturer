
import { SharedAstroSpot } from '@/types/weather';

// Location storage cache
const locationStore = new Map<string, SharedAstroSpot>();

/**
 * Add a location to the location store
 * @param location Location to store
 */
export function addLocationToStore(location: SharedAstroSpot): void {
  if (!location || !location.id) return;
  locationStore.set(location.id, location);
}

/**
 * Get a location from the store by ID
 * @param locationId ID of the location to retrieve
 * @returns The location or undefined if not found
 */
export function getLocationFromStore(locationId: string): SharedAstroSpot | undefined {
  return locationStore.get(locationId);
}

/**
 * Get all locations from the store
 * @returns Array of all stored locations
 */
export function getAllLocationsFromStore(): SharedAstroSpot[] {
  return Array.from(locationStore.values());
}

/**
 * Clear all locations from the store
 */
export function clearLocationStore(): void {
  locationStore.clear();
}
