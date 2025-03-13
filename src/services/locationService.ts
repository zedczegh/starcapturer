
import { calculateDistance, getLocationInfo } from "@/data/locationDatabase";
import { getLocationNameFromCoordinates as getLocationNameFromAPI } from "@/lib/api";

/**
 * Normalize longitude to the range [-180, 180]
 */
function normalizeLongitude(longitude: number): number {
  // Handle values outside the -180 to 180 range
  let normalizedLongitude = longitude;
  while (normalizedLongitude > 180) {
    normalizedLongitude -= 360;
  }
  while (normalizedLongitude < -180) {
    normalizedLongitude += 360;
  }
  return normalizedLongitude;
}

/**
 * Validates and corrects coordinates to ensure they're within valid ranges
 */
export function validateCoordinates(coordinates: { latitude: number; longitude: number }): { latitude: number; longitude: number } {
  const { latitude, longitude } = coordinates;
  
  const validLatitude = Math.max(-90, Math.min(90, latitude));
  const validLongitude = normalizeLongitude(longitude);
  
  return {
    latitude: validLatitude,
    longitude: validLongitude
  };
}

/**
 * Get location name and Bortle scale from coordinates
 */
export async function getLocationFromCoordinates(
  latitude: number, 
  longitude: number,
  language: string = 'en'
): Promise<{
  name: string;
  formattedName: string;
  bortleScale: number;
  latitude: number;
  longitude: number;
}> {
  // Validate coordinates first
  const validCoords = validateCoordinates({ latitude, longitude });
  
  // Get location info from our database
  const locationInfo = getLocationInfo(validCoords.latitude, validCoords.longitude);
  
  // Try to get a more detailed location name from the API
  let formattedName = locationInfo.formattedName;
  try {
    const apiLocationName = await getLocationNameFromAPI(validCoords.latitude, validCoords.longitude, language);
    if (apiLocationName && !apiLocationName.includes("°")) {
      formattedName = apiLocationName;
    }
  } catch (error) {
    console.error("Error getting location name from API:", error);
    // Continue with the database-derived name
  }
  
  return {
    name: locationInfo.name,
    formattedName: formattedName,
    bortleScale: locationInfo.bortleScale,
    latitude: validCoords.latitude,
    longitude: validCoords.longitude
  };
}

/**
 * Suggests popular nearby locations for stargazing
 */
export function getNearbyStargazingLocations(
  latitude: number,
  longitude: number,
  maxDistance: number = 200 // km
) {
  // Import the location database
  const { locationDatabase } = require("@/data/locationDatabase");
  
  // Filter to dark sites and natural areas (better for stargazing)
  return locationDatabase
    .filter(location => location.type === 'dark-site' || location.type === 'natural')
    .map(location => {
      const [locLat, locLng] = location.coordinates;
      const distance = calculateDistance(latitude, longitude, locLat, locLng);
      return {
        ...location,
        distance
      };
    })
    .filter(location => location.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5) // Return top 5 closest locations
    .map(location => ({
      name: location.name,
      latitude: location.coordinates[0],
      longitude: location.coordinates[1],
      bortleScale: location.bortleScale,
      distance: location.distance,
      travelTime: Math.round(location.distance / 60 * 60) // Rough estimate: ~60 km/h average speed
    }));
}

/**
 * Create a user-friendly message about a location's stargazing quality
 */
export function getStargazingQualityMessage(bortleScale: number, language: string = 'en'): string {
  if (bortleScale <= 3) {
    return language === 'en' 
      ? "This is an excellent location for astrophotography with dark skies." 
      : "这是一个非常适合天文摄影的位置，天空黑暗程度很高。";
  } else if (bortleScale <= 5) {
    return language === 'en'
      ? "This location has moderate light pollution. You can still capture many deep sky objects." 
      : "这个位置有中等程度的光污染。你仍然可以拍摄许多深空天体。";
  } else if (bortleScale <= 7) {
    return language === 'en'
      ? "Significant light pollution at this location. Consider using light pollution filters." 
      : "这个位置有显著的光污染。考虑使用光污染滤镜。";
  } else {
    return language === 'en'
      ? "Heavy light pollution. Best for lunar and planetary photography only." 
      : "严重的光污染。最适合月球和行星摄影。";
  }
}
