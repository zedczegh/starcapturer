
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation } from './validators';

/**
 * Validate a location using reverse geocoding
 * @param location The location to validate
 * @returns Promise resolving to boolean - true if valid, false otherwise
 */
export async function validateLocationWithReverseGeocoding(
  location: SharedAstroSpot
): Promise<boolean> {
  try {
    // Skip invalid coordinates
    if (!location.latitude || !location.longitude || 
        !isFinite(location.latitude) || !isFinite(location.longitude)) {
      return false;
    }
    
    // Skip locations that are already known to be in water
    const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
    if (!isCertified && isWaterLocation(location.latitude, location.longitude, false)) {
      return false;
    }
    
    // In a real implementation, we would call a geocoding service here
    // For now, let's just return true if the location is on land
    return !isWaterLocation(location.latitude, location.longitude, isCertified);
    
  } catch (error) {
    console.error("Error validating location:", error);
    return false;
  }
}
