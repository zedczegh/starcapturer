
/**
 * Check if a location is valid for astronomy (not on water)
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param name Optional location name
 * @returns True if location is valid for astronomy
 */
export function isValidAstronomyLocation(
  latitude: number,
  longitude: number,
  name?: string
): boolean {
  // In a real implementation, this would check if the location is on land, 
  // not in a large body of water, and suitable for astronomy
  return true;
}

/**
 * Check if a location is on water (ocean, lake, etc)
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param checkNearbyLand Optional, whether to check if nearby land exists
 * @returns True if location is on water
 */
export function isWaterLocation(
  latitude: number,
  longitude: number,
  checkNearbyLand: boolean = false
): boolean {
  // In a real implementation, this would check if the location is on water
  return false;
}
