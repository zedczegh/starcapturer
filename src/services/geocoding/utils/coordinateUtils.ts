
/**
 * Normalize coordinates for consistent lookup and caching
 * @param latitude Raw latitude value
 * @param longitude Raw longitude value
 * @returns [number, number] Normalized [lat, lng]
 */
export function normalizeCoordinates(latitude: number, longitude: number): [number, number] {
  const lat = Math.max(-90, Math.min(90, latitude));
  const lng = ((longitude + 180) % 360 + 360) % 360 - 180;
  return [parseFloat(lat.toFixed(4)), parseFloat(lng.toFixed(4))];
}

/**
 * Generate a cache key for the given coordinates and language
 * @param latitude Normalized latitude
 * @param longitude Normalized longitude
 * @param language Language code
 * @returns Cache key string
 */
export function generateCacheKey(latitude: number, longitude: number, language: string): string {
  const [normalizedLat, normalizedLng] = normalizeCoordinates(latitude, longitude);
  return `geocode_${normalizedLat}_${normalizedLng}_${language}`;
}
