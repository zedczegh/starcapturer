
import { calculateDistance } from "@/data/locationDatabase";
import { internationalLocations } from "@/data/regions/internationalLocations";
import { chinaCityLocations } from "@/data/regions/chinaCityLocations";
import { restrictedDrivingCities } from "@/data/regions/restrictedDrivingCities";
import { LocationEntry } from "@/data/locationDatabase";

// Enhanced location entry type with more detailed location information
interface DetailedLocationEntry {
  name: string;
  coordinates: [number, number];
  chineseName?: string;
  village?: string;
  villageZh?: string;
  county?: string;
  countyZh?: string;
  city?: string;
  cityZh?: string;
  type?: 'city' | 'county' | 'village' | 'international';
}

// Convert our existing location data to the detailed format
const combinedTownLocations: DetailedLocationEntry[] = [
  // Use all cities from the driving restrictions database
  ...restrictedDrivingCities.map(city => ({
    name: city.city,
    coordinates: city.coordinates,
    chineseName: city.city, // Most Chinese cities should have the same name as identifier
    city: city.city,
    cityZh: city.city,
    type: 'city' as const
  })),
  
  // Use international locations
  ...internationalLocations.map(location => ({
    name: location.name,
    coordinates: location.coordinates,
    chineseName: location.chineseName || location.name,
    city: location.name,
    cityZh: location.chineseName || location.name,
    type: 'international' as const
  })),
  
  // Use China city locations with more detailed information
  ...(Array.isArray(chinaCityLocations) ? chinaCityLocations.map(city => {
    // Try to extract county and village info from name if available
    let cityName = city.name;
    let countyName = '';
    let villageName = '';
    
    // In Chinese data, sometimes names are structured as "City, County, Village"
    const nameParts = city.name.split(',').map(part => part.trim());
    if (nameParts.length > 1) {
      cityName = nameParts[0];
      countyName = nameParts[1];
      if (nameParts.length > 2) {
        villageName = nameParts[2];
      }
    }
    
    // Same for Chinese names
    let cityNameZh = city.chineseName || city.name;
    let countyNameZh = '';
    let villageNameZh = '';
    
    if (city.chineseName) {
      const chineseNameParts = city.chineseName.split('，').map(part => part.trim());
      if (chineseNameParts.length > 1) {
        cityNameZh = chineseNameParts[0];
        countyNameZh = chineseNameParts[1];
        if (chineseNameParts.length > 2) {
          villageNameZh = chineseNameParts[2];
        }
      }
    }
    
    return {
      name: city.name,
      coordinates: city.coordinates,
      chineseName: city.chineseName || city.name,
      village: villageName || undefined,
      villageZh: villageNameZh || undefined,
      county: countyName || undefined,
      countyZh: countyNameZh || undefined,
      city: cityName,
      cityZh: cityNameZh,
      type: 'city' as const
    };
  }) : [])
];

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

  // Create a detailed name that includes village, county, and city when available
  const hasVillage = closestTown.village && closestTown.village.length > 0;
  const hasCounty = closestTown.county && closestTown.county.length > 0;
  const hasCity = closestTown.city && closestTown.city.length > 0;
  
  let detailedNameParts: string[] = [];
  
  // For English format: Village, County, City
  if (language === 'en') {
    if (hasVillage) detailedNameParts.push(closestTown.village!);
    if (hasCounty) detailedNameParts.push(closestTown.county!);
    if (hasCity && closestTown.city !== closestTown.county && closestTown.city !== closestTown.village) 
      detailedNameParts.push(closestTown.city!);
  } 
  // For Chinese format: City县County镇Village
  else {
    if (hasCity) {
      const cityName = closestTown.cityZh || closestTown.city;
      detailedNameParts.push(cityName!);
    }
    if (hasCounty) {
      const countyName = closestTown.countyZh || closestTown.county;
      if (countyName !== detailedNameParts[0]) {
        detailedNameParts.push(countyName!);
      }
    }
    if (hasVillage) {
      const villageName = closestTown.villageZh || closestTown.village;
      if (villageName !== detailedNameParts[0] && villageName !== detailedNameParts[1]) {
        detailedNameParts.push(villageName!);
      }
    }
  }
  
  // If we couldn't build a detailed name, fall back to city or base name
  const detailedName = detailedNameParts.length > 0 
    ? detailedNameParts.join(language === 'en' ? ', ' : '')
    : (language === 'en' ? closestTown.name : (closestTown.chineseName || closestTown.name));
  
  // Use the appropriate name based on language
  const townName = language === 'en' 
    ? (hasVillage ? closestTown.village! : (hasCounty ? closestTown.county! : closestTown.name))
    : (closestTown.villageZh || closestTown.countyZh || closestTown.chineseName || closestTown.name);

  return {
    townName,
    distance: closestTown.distance,
    formattedDistance,
    detailedName,
    village: hasVillage ? (language === 'en' ? closestTown.village : closestTown.villageZh) : undefined,
    county: hasCounty ? (language === 'en' ? closestTown.county : closestTown.countyZh) : undefined,
    city: hasCity ? (language === 'en' ? closestTown.city : closestTown.cityZh) : undefined,
  };
}
