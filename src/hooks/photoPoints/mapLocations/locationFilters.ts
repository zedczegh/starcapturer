import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { validateLocationWithReverseGeocoding } from '@/utils/location/reverseGeocodingValidator';

/**
 * Filter locations based on distance from user location
 */
export const filterLocationsByDistance = (
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number,
  locationChanged: boolean,
  isCertified: boolean
): SharedAstroSpot[] => {
  if (!userLocation || isCertified) {
    return locations; // Don't filter certified locations by distance
  }

  return locations.filter(loc => {
    if (loc.isDarkSkyReserve || loc.certification) {
      return true; // Never filter certified locations by distance
    }

    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      loc.latitude,
      loc.longitude
    );
    
    // Important: DON'T filter by distance when locations have just changed
    return !locationChanged || distance <= searchRadius;
  });
};

/**
 * Filter out water locations using reverse geocoding
 */
export const filterWaterLocations = async (
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> => {
  const filteredLocations = await Promise.all(
    locations.map(async (loc) => {
      // Skip certified locations
      if (loc.isDarkSkyReserve || loc.certification) return loc;
      
      // Check if it's a water location using geocoding validation
      try {
        const isValid = await validateLocationWithReverseGeocoding(loc);
        // Return null for water locations (will be filtered out)
        return isValid ? loc : null;
      } catch (error) {
        console.warn("Error validating location:", error);
        // If validation fails, keep the location
        return loc;
      }
    })
  );
  
  // Filter out null values (water locations)
  return filteredLocations.filter(loc => loc !== null) as SharedAstroSpot[];
};
