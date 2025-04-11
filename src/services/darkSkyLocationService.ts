
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/utils/geoUtils";
import { locationDatabase } from "@/data/locationDatabase";

/**
 * Find all dark sky locations in the database 
 */
export const findAllDarkSkyLocations = (): SharedAstroSpot[] => {
  if (!locationDatabase) {
    console.error('Location database is not initialized');
    return [];
  }

  // Extract all locations that are marked as dark sky reserves or have certifications
  return locationDatabase
    .filter(loc => loc.isDarkSkyReserve || loc.certification)
    .map(loc => {
      const [lat, lng] = loc.coordinates;
      return {
        id: `dark-sky-${lat}-${lng}`,
        name: loc.name,
        chineseName: loc.chineseName,
        latitude: lat,
        longitude: lng,
        bortleScale: loc.bortleScale,
        certification: loc.certification,
        isDarkSkyReserve: loc.isDarkSkyReserve,
        timestamp: new Date().toISOString(),
      } as SharedAstroSpot;
    });
};

/**
 * Find dark sky locations near specified coordinates
 * @param latitude Central latitude
 * @param longitude Central longitude
 * @param maxDistance Maximum search radius in kilometers
 * @returns Array of dark sky locations sorted by distance
 */
export const findNearbyDarkSkyLocations = (
  latitude: number,
  longitude: number,
  maxDistance: number = 1000
): SharedAstroSpot[] => {
  const allLocations = findAllDarkSkyLocations();
  
  // Filter by distance and add distance property
  return allLocations
    .map(loc => {
      if (!loc.latitude || !loc.longitude) return null;
      const distance = calculateDistance(latitude, longitude, loc.latitude, loc.longitude);
      return { ...loc, distance };
    })
    .filter((loc): loc is SharedAstroSpot & { distance: number } => 
      loc !== null && loc.distance <= maxDistance
    )
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Get count of dark sky locations in database
 */
export const getDarkSkyLocationCount = (): number => {
  if (!locationDatabase) return 0;
  return locationDatabase.filter(loc => loc.isDarkSkyReserve || loc.certification).length;
};
