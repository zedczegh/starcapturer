
import { calculateDistance } from "@/data/locationDatabase";
import { DetailedLocationEntry, combinedTownLocations } from "./location/townData";
import { formatDistance } from "./location/formatDistance";

/**
 * Find the nearest town/city to a given location with enhanced details
 * @param latitude Latitude of the target location
 * @param longitude Longitude of the target location
 * @param language Current display language
 * @returns Object containing the nearest town and distance information with detailed naming
 */
export function findNearestTown(
  latitude: number, 
  longitude: number,
  language: string = 'en'
): {
  townName: string;
  distance: number;
  formattedDistance: string;
  detailedName: string; // New field for detailed location (village, county, city)
  village?: string;
  county?: string;
  city?: string;
} {
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return {
      townName: language === 'en' ? 'Unknown location' : '未知位置',
      distance: 0,
      formattedDistance: language === 'en' ? 'Unknown distance' : '未知距离',
      detailedName: language === 'en' ? 'Unknown location' : '未知位置',
    };
  }

  // Find the closest town by calculating distance to all known locations
  let closestTown: DetailedLocationEntry & { distance: number } = {
    name: language === 'en' ? 'Remote area' : '偏远地区',
    chineseName: '偏远地区',
    coordinates: [0, 0] as [number, number],
    distance: Number.MAX_VALUE,
    city: language === 'en' ? 'Remote area' : '偏远地区',
    cityZh: '偏远地区',
    type: 'international'
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
  const formattedDistance = formatDistance(closestTown.distance, language);

  // Create a detailed name based on location hierarchy
  const detailedName = createDetailedName(closestTown, language);
  
  // Use the appropriate name based on language
  const hasVillage = closestTown.village && closestTown.village.length > 0;
  const hasCounty = closestTown.county && closestTown.county.length > 0;
  
  let townName;
  if (language === 'en') {
    townName = hasVillage ? closestTown.village! : (hasCounty ? closestTown.county! : closestTown.name);
  } else {
    // For Chinese, prioritize Chinese names
    townName = closestTown.villageZh || closestTown.countyZh || closestTown.chineseName || closestTown.name;
  }

  return {
    townName,
    distance: closestTown.distance,
    formattedDistance,
    detailedName,
    village: hasVillage ? (language === 'en' ? closestTown.village : closestTown.villageZh) : undefined,
    county: hasCounty ? (language === 'en' ? closestTown.county : closestTown.countyZh) : undefined,
    city: closestTown.city ? (language === 'en' ? closestTown.city : closestTown.cityZh) : undefined,
  };
}

/**
 * Create a detailed name that includes village, county, and city when available
 */
function createDetailedName(
  location: DetailedLocationEntry & { distance: number },
  language: string
): string {
  const hasVillage = location.village && location.village.length > 0;
  const hasCounty = location.county && location.county.length > 0;
  const hasCity = location.city && location.city.length > 0;
  
  let detailedNameParts: string[] = [];
  
  // For English format: Village, County, City
  if (language === 'en') {
    if (hasVillage) detailedNameParts.push(location.village!);
    if (hasCounty && (!hasVillage || location.county !== location.village)) 
      detailedNameParts.push(location.county!);
    if (hasCity && location.city !== location.county && location.city !== location.village) 
      detailedNameParts.push(location.city!);
  } 
  // For Chinese format: City县County镇Village
  else {
    if (hasCity) {
      const cityName = location.cityZh || location.city;
      if (cityName && cityName !== '偏远地区') {
        detailedNameParts.push(cityName);
      }
    }
    if (hasCounty) {
      const countyName = location.countyZh || location.county;
      if (countyName && (detailedNameParts.length === 0 || countyName !== detailedNameParts[0])) {
        detailedNameParts.push(countyName);
      }
    }
    if (hasVillage) {
      const villageName = location.villageZh || location.village;
      if (villageName && detailedNameParts.every(part => part !== villageName)) {
        detailedNameParts.push(villageName);
      }
    }
  }
  
  // If we couldn't build a detailed name, fall back to city or base name
  let detailedName;
  if (detailedNameParts.length > 0) {
    detailedName = detailedNameParts.join(language === 'en' ? ', ' : '');
  } else if (language === 'en') {
    detailedName = location.name;
  } else {
    // For Chinese, use the Chinese name if available
    detailedName = location.chineseName || location.name;
  }
  
  return detailedName;
}
