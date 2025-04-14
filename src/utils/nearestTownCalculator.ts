
import { calculateDistance } from "@/data/locationDatabase";
import { internationalLocations } from "@/data/regions/internationalLocations";
import { chinaCityLocations } from "@/data/regions/chinaCityLocations";
import { restrictedDrivingCities } from "@/data/regions/restrictedDrivingCities";
import { LocationEntry } from "@/data/locationDatabase";
import { useLanguage } from "@/contexts/LanguageContext";

// Combine all location data sources for nearest town lookup
const combinedTownLocations: Array<{name: string, coordinates: [number, number], chineseName?: string}> = [
  // Use all cities from the driving restrictions database
  ...restrictedDrivingCities.map(city => ({
    name: city.city,
    coordinates: city.coordinates,
    chineseName: undefined // Use city.city as both English and Chinese names
  })),
  
  // Use international locations
  ...internationalLocations.map(location => ({
    name: location.name,
    coordinates: location.coordinates,
    chineseName: undefined // International locations don't have separate Chinese names
  })),
  
  // Use China city locations if available
  ...(Array.isArray(chinaCityLocations) ? chinaCityLocations.map(city => ({
    name: city.name,
    coordinates: city.coordinates,
    chineseName: city.chineseName || undefined
  })) : [])
];

/**
 * Find the nearest town/city to a given location
 * @param latitude Latitude of the target location
 * @param longitude Longitude of the target location
 * @param language Current display language
 * @returns Object containing the nearest town and distance information
 */
export function findNearestTown(
  latitude: number, 
  longitude: number,
  language: string = 'en'
): {
  townName: string;
  distance: number;
  formattedDistance: string;
} {
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return {
      townName: language === 'en' ? 'Unknown location' : '未知位置',
      distance: 0,
      formattedDistance: language === 'en' ? 'Unknown distance' : '未知距离'
    };
  }

  // Find the closest town by calculating distance to all known locations
  let closestTown: {
    name: string;
    chineseName?: string;
    coordinates: [number, number];
    distance: number;
  } = {
    name: language === 'en' ? 'Remote area' : '偏远地区',
    chineseName: undefined,
    coordinates: [0, 0] as [number, number],
    distance: Number.MAX_VALUE
  };

  for (const town of combinedTownLocations) {
    const distance = calculateDistance(
      latitude, 
      longitude, 
      town.coordinates[0], 
      town.coordinates[1]
    );

    if (distance < closestTown.distance) {
      closestTown = {
        ...town,
        distance
      };
    }
  }

  // Format the distance for display
  let formattedDistance = '';
  if (closestTown.distance < 1) {
    formattedDistance = language === 'en' 
      ? `${Math.round(closestTown.distance * 1000)} m away` 
      : `${Math.round(closestTown.distance * 1000)} 米`;
  } else if (closestTown.distance < 10) {
    formattedDistance = language === 'en' 
      ? `${closestTown.distance.toFixed(1)} km away` 
      : `${closestTown.distance.toFixed(1)} 公里`;
  } else {
    formattedDistance = language === 'en' 
      ? `${Math.round(closestTown.distance)} km away` 
      : `${Math.round(closestTown.distance)} 公里`;
  }

  // Use the appropriate name based on language
  const townName = language === 'en' 
    ? closestTown.name 
    : (closestTown.chineseName || closestTown.name);

  return {
    townName,
    distance: closestTown.distance,
    formattedDistance
  };
}
