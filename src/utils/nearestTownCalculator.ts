import { calculateDistance } from "@/data/locationDatabase";
import { DetailedLocationEntry, combinedTownLocations } from "./location/townData";
import { formatDistance } from "./location/formatDistance";

export function findNearestTown(
  latitude: number, 
  longitude: number,
  language: string = 'en'
): {
  townName: string;
  distance: number;
  detailedName: string;
  village?: string;
  county?: string;
  city?: string;
} {
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return {
      townName: language === 'en' ? 'Unknown location' : '未知位置',
      distance: 0,
      detailedName: language === 'en' ? 'Unknown location' : '未知位置',
      village: undefined,
      county: undefined,
      city: undefined,
    };
  }

  // Find multiple close locations and choose the best one
  const maxDistanceKm = 200; // Maximum distance to consider
  const closeLocations: Array<DetailedLocationEntry & { distance: number }> = [];
  
  // First pass: find all locations within reasonable distance
  for (const town of combinedTownLocations) {
    const distance = calculateDistance(
      latitude, 
      longitude, 
      town.coordinates[0], 
      town.coordinates[1]
    );
    
    if (distance <= maxDistanceKm) {
      closeLocations.push({
        ...town,
        distance
      });
    }
  }
  
  // Sort by distance
  closeLocations.sort((a, b) => a.distance - b.distance);
  
  // If no close locations found, use the closest one regardless of distance
  if (closeLocations.length === 0) {
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
    
    closeLocations.push(closestTown);
  }
  
  // Prioritize locations based on location type, detail level, and distance
  let selectedLocation = closeLocations[0]; // Default to closest
  
  // Second pass: Apply heuristics to choose the best location
  for (const location of closeLocations) {
    // Skip the first one as it's our default
    if (location === closeLocations[0]) continue;
    
    // If this location has more detailed information (village or county) and is within 2x the distance of the closest
    const hasMoreDetails = (location.village || location.county) && 
                          (!selectedLocation.village && !selectedLocation.county);
                          
    const isChineseLocation = location.chineseName && 
                             language === 'zh' && 
                             !selectedLocation.chineseName;
                             
    const isReasonableDistance = location.distance <= (selectedLocation.distance * 2) && location.distance < 50;
    
    // Prioritize locations with Chinese names in Chinese language mode
    if (language === 'zh' && location.chineseName && !selectedLocation.chineseName && location.distance < 100) {
      selectedLocation = location;
      continue;
    }
    
    // Prioritize more detailed locations if they're reasonably close
    if (hasMoreDetails && isReasonableDistance) {
      selectedLocation = location;
      continue;
    }
    
    // Prefer cities over counties over villages when very close to them
    if (location.type === 'city' && selectedLocation.type !== 'city' && location.distance < 30) {
      selectedLocation = location;
      continue;
    }
    
    // When in a remote area, prefer larger population centers for better context
    if (selectedLocation.distance > 50 && 
        location.distance < 100 && 
        location.population && 
        selectedLocation.population && 
        location.population > selectedLocation.population * 5) {
      selectedLocation = location;
      continue;
    }
    
    // For very remote locations, include province/region information when available
    if (selectedLocation.distance > 80 && 
        location.distance < 150 && 
        ((language === 'zh' && location.provinceZh) || 
         (language === 'en' && location.province))) {
      selectedLocation = location;
      continue;
    }
  }
  
  // Format the distance for display
  const formattedDistance = formatDistance(selectedLocation.distance, language);

  // Create a detailed name based on location hierarchy
  const detailedName = createDetailedName(selectedLocation, language);
  
  // Use the appropriate name based on language
  const hasVillage = selectedLocation.village && selectedLocation.village.length > 0;
  const hasCounty = selectedLocation.county && selectedLocation.county.length > 0;
  
  let townName;
  if (language === 'en') {
    // For English, prioritize most specific location name
    townName = hasVillage ? selectedLocation.village! : (hasCounty ? selectedLocation.county! : selectedLocation.name);
  } else {
    // For Chinese, prioritize Chinese names with proper fallbacks
    if (hasVillage && selectedLocation.villageZh) {
      townName = selectedLocation.villageZh;
    } else if (hasCounty && selectedLocation.countyZh) {
      townName = selectedLocation.countyZh;
    } else if (selectedLocation.chineseName) {
      townName = selectedLocation.chineseName;
    } else if (hasVillage) {
      // Fallback to English village name if no Chinese name available
      townName = selectedLocation.village;
    } else if (hasCounty) {
      // Fallback to English county name if no Chinese name available
      townName = selectedLocation.county;
    } else {
      // Final fallback to English name
      townName = selectedLocation.name;
    }
  }

  return {
    townName,
    distance: selectedLocation.distance,
    detailedName,
    village: hasVillage ? (language === 'en' ? selectedLocation.village : selectedLocation.villageZh) : undefined,
    county: hasCounty ? (language === 'en' ? selectedLocation.county : selectedLocation.countyZh) : undefined,
    city: selectedLocation.city ? (language === 'en' ? selectedLocation.city : selectedLocation.cityZh) : undefined,
  };
}

// Modify the createDetailedName function to remove distance in parentheses
function createDetailedName(
  location: DetailedLocationEntry & { distance: number },
  language: string
): string {
  const hasVillage = location.village && location.village.length > 0;
  const hasCounty = location.county && location.county.length > 0;
  const hasCity = location.city && location.city.length > 0;
  const hasProvince = language === 'en' ? 
    (location.province && location.province.length > 0) : 
    (location.provinceZh && location.provinceZh.length > 0);
  
  let detailedNameParts: string[] = [];
  
  // For English format: Village, County, City
  if (language === 'en') {
    if (hasVillage) detailedNameParts.push(location.village!);
    
    if (hasCounty && (!hasVillage || location.county !== location.village)) 
      detailedNameParts.push(location.county!);
    
    if (hasCity && 
        (!hasCounty || location.city !== location.county) && 
        (!hasVillage || location.city !== location.village)) 
      detailedNameParts.push(location.city!);
      
    // Add province for remote locations or when available
    if (hasProvince && 
        (!hasCity || location.province !== location.city) &&
        location.distance > 30) {
      detailedNameParts.push(location.province!);
    }
  } 
  // For Chinese format: City县County镇Village
  else {
    // Build the Chinese detailed name with appropriate names and fallbacks
    if (hasCity) {
      const cityName = location.cityZh || location.city;
      if (cityName && cityName !== '偏远地区') {
        detailedNameParts.push(cityName);
      }
    }
    
    if (hasCounty) {
      const countyName = location.countyZh || location.county;
      if (countyName && (detailedNameParts.length === 0 || !detailedNameParts.some(part => part === countyName))) {
        detailedNameParts.push(countyName);
      }
    }
    
    if (hasVillage) {
      const villageName = location.villageZh || location.village;
      if (villageName && !detailedNameParts.some(part => part === villageName)) {
        detailedNameParts.push(villageName);
      }
    }
    
    // Add province for remote locations or when available
    if (hasProvince && location.distance > 30) {
      const provinceName = location.provinceZh;
      if (provinceName && !detailedNameParts.some(part => part === provinceName)) {
        if (detailedNameParts.length === 0) {
          detailedNameParts.push(provinceName);
        } else {
          // For Chinese, province typically comes first
          detailedNameParts.unshift(provinceName);
        }
      }
    }
  }
  
  // If we couldn't build a detailed name, fall back to city or base name
  let detailedName;
  if (detailedNameParts.length > 0) {
    // Use appropriate separators based on language
    detailedName = language === 'en' 
      ? detailedNameParts.join(', ')
      : detailedNameParts.join('');
  } else if (language === 'en') {
    detailedName = location.name;
  } else {
    // For Chinese, use the Chinese name if available
    detailedName = location.chineseName || location.name;
  }
  
  return detailedName;
}
