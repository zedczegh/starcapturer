
import { Language } from "@/services/geocoding/types";

/**
 * Format and clean up location names for display
 * Removes duplicates and unnecessary parts
 */
export function formatLocationName(locationName: string, language: Language = 'en'): string {
  if (!locationName) return language === 'en' ? 'Unknown location' : '未知位置';
  
  // If it contains coordinates, return a friendlier message
  if (locationName.includes('°') || locationName.includes('Location at') || locationName.includes('位置在')) {
    return language === 'en' ? 'Remote area' : '偏远地区';
  }
  
  // Split by commas based on language
  const separator = language === 'en' ? ',' : '，';
  const parts = locationName.split(separator);
  
  // Remove duplicate parts while preserving order
  const uniqueParts = [...new Set(parts.map(p => p.trim()))];
  
  // For long names, use just the first part or first two parts
  if (uniqueParts.length > 3) {
    if (language === 'en') {
      return uniqueParts.slice(0, 2).join(', ');
    } else {
      return uniqueParts.slice(0, 2).join('，');
    }
  }
  
  // For shorter names, keep all parts
  return uniqueParts.join(language === 'en' ? ', ' : '，');
}

/**
 * Extract town name from a longer location string
 */
export function extractTownName(locationName: string, language: Language = 'en'): string {
  if (!locationName) return language === 'en' ? 'Unknown location' : '未知位置';
  
  // If it contains coordinates, return a friendlier message
  if (locationName.includes('°') || locationName.includes('Location at') || locationName.includes('位置在')) {
    return language === 'en' ? 'Remote area' : '偏远地区';
  }
  
  // Split by commas based on language
  const separator = language === 'en' ? ',' : '，';
  const parts = locationName.split(separator);
  
  // Just return the first part as the town name
  if (parts.length > 0) {
    return parts[0].trim();
  }
  
  return locationName;
}

/**
 * Get a regional name based on direction and province/state
 * Uses cardinal directions (North, South, East, West) plus region name
 */
export function getRegionalName(
  latitude: number, 
  longitude: number, 
  language: Language = 'en'
): string {
  // Determine the region based on coordinates
  const region = determineRegion(latitude, longitude, language);
  
  // If we couldn't determine a region, return a generic name
  if (!region) {
    return language === 'en' ? 'Remote area' : '偏远地区';
  }
  
  return region;
}

/**
 * Improved location name formatter for PhotoPointCard component
 * Extracts meaningful location names from complex strings
 */
export function extractNearestTownName(
  locationName: string, 
  description: string | undefined, 
  language: Language = 'en'
): string {
  // First check if description contains location info
  if (description) {
    const nearText = language === 'en' ? "near" : "靠近";
    if (description.toLowerCase().includes(nearText.toLowerCase())) {
      const parts = description.split(new RegExp(nearText, 'i'));
      if (parts.length > 1) {
        return parts[1].trim();
      }
    }
  }
  
  // If location name is not coordinates or "Remote area", use it
  if (locationName && 
      !locationName.includes("°") && 
      !locationName.includes("Location at") && 
      !locationName.includes("位置在") &&
      !locationName.includes("Remote area") &&
      !locationName.includes("偏远地区")) {
      
    // Extract just the first part of a comma-separated name
    const separator = language === 'en' ? ',' : '，';
    const parts = locationName.split(separator);
    if (parts.length > 0) {
      return parts[0].trim();
    }
    
    return locationName;
  }
  
  return language === 'en' ? 'Remote area' : '偏远地区';
}

/**
 * Determine the region based on coordinates
 * Returns a string like "Northwest Yunnan" or "Western Sichuan"
 */
function determineRegion(latitude: number, longitude: number, language: Language = 'en'): string {
  // China regions
  if (latitude >= 18 && latitude <= 53 && longitude >= 73 && longitude <= 135) {
    return determineChineseRegion(latitude, longitude, language);
  }
  
  // United States regions
  if (latitude >= 24 && latitude <= 50 && longitude >= -125 && longitude <= -66) {
    return determineUSRegion(latitude, longitude, language);
  }
  
  // Europe regions
  if (latitude >= 36 && latitude <= 71 && longitude >= -10 && longitude <= 40) {
    return determineEuropeanRegion(latitude, longitude, language);
  }
  
  // If we couldn't determine a specific region, use continental regions
  return determineContinentalRegion(latitude, longitude, language);
}

/**
 * Determine Chinese region names based on coordinates
 */
function determineChineseRegion(latitude: number, longitude: number, language: Language): string {
  // Tibet / Xizang
  if (latitude > 27 && latitude < 37 && longitude > 78 && longitude < 99) {
    if (longitude < 85) {
      return language === 'en' ? 'Western Tibet' : '西藏西部';
    } else if (longitude > 92) {
      return language === 'en' ? 'Eastern Tibet' : '西藏东部';
    } else {
      return language === 'en' ? 'Central Tibet' : '西藏中部';
    }
  }
  
  // Xinjiang
  if (latitude > 35 && latitude < 50 && longitude > 73 && longitude < 96) {
    if (latitude > 45) {
      return language === 'en' ? 'Northern Xinjiang' : '新疆北部';
    } else if (latitude < 40) {
      return language === 'en' ? 'Southern Xinjiang' : '新疆南部';
    } else {
      return language === 'en' ? 'Central Xinjiang' : '新疆中部';
    }
  }
  
  // Inner Mongolia
  if (latitude > 37 && latitude < 46 && longitude > 97 && longitude < 126) {
    if (longitude < 110) {
      return language === 'en' ? 'Western Inner Mongolia' : '内蒙古西部';
    } else {
      return language === 'en' ? 'Eastern Inner Mongolia' : '内蒙古东部';
    }
  }
  
  // Qinghai
  if (latitude > 31 && latitude < 39 && longitude > 89 && longitude < 103) {
    if (longitude < 95) {
      return language === 'en' ? 'Western Qinghai' : '青海西部';
    } else {
      return language === 'en' ? 'Eastern Qinghai' : '青海东部';
    }
  }
  
  // Gansu
  if (latitude > 32 && latitude < 42.5 && longitude > 92.5 && longitude < 108) {
    if (longitude < 100) {
      return language === 'en' ? 'Western Gansu' : '甘肃西部';
    } else {
      return language === 'en' ? 'Eastern Gansu' : '甘肃东部';
    }
  }
  
  // Sichuan
  if (latitude > 26 && latitude < 34 && longitude > 97 && longitude < 109) {
    if (longitude < 102) {
      return language === 'en' ? 'Western Sichuan' : '四川西部';
    } else {
      return language === 'en' ? 'Eastern Sichuan' : '四川东部';
    }
  }
  
  // Yunnan
  if (latitude > 21 && latitude < 29 && longitude > 97 && longitude < 106) {
    if (latitude > 25) {
      return language === 'en' ? 'Northern Yunnan' : '云南北部';
    } else {
      return language === 'en' ? 'Southern Yunnan' : '云南南部';
    }
  }
  
  // Heilongjiang (Northeast China)
  if (latitude > 43 && latitude < 54 && longitude > 121 && longitude < 135) {
    return language === 'en' ? 'Heilongjiang Province' : '黑龙江省';
  }
  
  // Jilin (Northeast China)
  if (latitude > 40 && latitude < 46 && longitude > 121 && longitude < 131) {
    return language === 'en' ? 'Jilin Province' : '吉林省';
  }
  
  // Liaoning (Northeast China)
  if (latitude > 38 && latitude < 43 && longitude > 118 && longitude < 126) {
    return language === 'en' ? 'Liaoning Province' : '辽宁省';
  }
  
  // Guangxi
  if (latitude > 21 && latitude < 26 && longitude > 104 && longitude < 112) {
    return language === 'en' ? 'Guangxi Region' : '广西地区';
  }
  
  // Guizhou
  if (latitude > 24 && latitude < 29 && longitude > 103 && longitude < 110) {
    return language === 'en' ? 'Guizhou Province' : '贵州省';
  }
  
  // Default China regional fallbacks
  if (latitude > 30) {
    if (longitude < 105) {
      return language === 'en' ? 'Northwest China' : '中国西北';
    } else if (longitude > 115) {
      return language === 'en' ? 'Northeast China' : '中国东北';
    } else {
      return language === 'en' ? 'North China' : '中国北部';
    }
  } else {
    if (longitude < 105) {
      return language === 'en' ? 'Southwest China' : '中国西南';
    } else if (longitude > 115) {
      return language === 'en' ? 'Southeast China' : '中国东南';
    } else {
      return language === 'en' ? 'South China' : '中国南部';
    }
  }
}

/**
 * Determine US region names based on coordinates
 */
function determineUSRegion(latitude: number, longitude: number, language: Language): string {
  // Pacific Northwest
  if (latitude > 42 && latitude < 49 && longitude > -125 && longitude < -116) {
    return language === 'en' ? 'Pacific Northwest' : '美国太平洋西北';
  }
  
  // California
  if (latitude > 32 && latitude < 42 && longitude > -125 && longitude < -114) {
    if (latitude > 38) {
      return language === 'en' ? 'Northern California' : '北加利福尼亚';
    } else {
      return language === 'en' ? 'Southern California' : '南加利福尼亚';
    }
  }
  
  // Southwest
  if (latitude > 31 && latitude < 37 && longitude > -115 && longitude < -102) {
    return language === 'en' ? 'Southwest US' : '美国西南';
  }
  
  // Mountain West
  if (latitude > 37 && latitude < 49 && longitude > -116 && longitude < -102) {
    return language === 'en' ? 'Mountain West' : '美国山区西部';
  }
  
  // Midwest
  if (latitude > 36 && latitude < 49 && longitude > -102 && longitude < -80) {
    return language === 'en' ? 'Midwest US' : '美国中西部';
  }
  
  // Northeast
  if (latitude > 40 && latitude < 47 && longitude > -80 && longitude < -66) {
    return language === 'en' ? 'Northeast US' : '美国东北';
  }
  
  // Southeast
  if (latitude > 25 && latitude < 40 && longitude > -90 && longitude < -75) {
    return language === 'en' ? 'Southeast US' : '美国东南';
  }
  
  // Texas
  if (latitude > 26 && latitude < 36 && longitude > -106 && longitude < -93) {
    return language === 'en' ? 'Texas' : '德克萨斯';
  }
  
  // Alaska
  if (latitude > 51 && latitude < 72 && longitude > -170 && longitude < -130) {
    return language === 'en' ? 'Alaska' : '阿拉斯加';
  }
  
  // Hawaii
  if (latitude > 18 && latitude < 23 && longitude > -161 && longitude < -154) {
    return language === 'en' ? 'Hawaii' : '夏威夷';
  }
  
  // Generic US fallback
  return language === 'en' ? 'United States' : '美国';
}

/**
 * Determine European region names based on coordinates
 */
function determineEuropeanRegion(latitude: number, longitude: number, language: Language): string {
  // Northern Europe
  if (latitude > 55 && longitude > -10 && longitude < 40) {
    return language === 'en' ? 'Northern Europe' : '北欧';
  }
  
  // Western Europe
  if (latitude > 43 && latitude < 55 && longitude > -10 && longitude < 10) {
    return language === 'en' ? 'Western Europe' : '西欧';
  }
  
  // Central Europe
  if (latitude > 45 && latitude < 55 && longitude > 10 && longitude < 25) {
    return language === 'en' ? 'Central Europe' : '中欧';
  }
  
  // Eastern Europe
  if (latitude > 45 && latitude < 60 && longitude > 25 && longitude < 40) {
    return language === 'en' ? 'Eastern Europe' : '东欧';
  }
  
  // Southern Europe
  if (latitude > 35 && latitude < 45 && longitude > -10 && longitude < 30) {
    return language === 'en' ? 'Southern Europe' : '南欧';
  }
  
  // Generic Europe fallback
  return language === 'en' ? 'Europe' : '欧洲';
}

/**
 * Determine continental region based on coordinates
 */
function determineContinentalRegion(latitude: number, longitude: number, language: Language): string {
  // North America
  if (longitude >= -170 && longitude <= -50 && latitude >= 15 && latitude <= 90) {
    return language === 'en' ? 'North America' : '北美洲';
  }
  
  // South America
  if (longitude >= -90 && longitude <= -30 && latitude >= -60 && latitude <= 15) {
    return language === 'en' ? 'South America' : '南美洲';
  }
  
  // Europe
  if (longitude >= -25 && longitude <= 40 && latitude >= 35 && latitude <= 80) {
    return language === 'en' ? 'Europe' : '欧洲';
  }
  
  // Africa
  if (longitude >= -25 && longitude <= 55 && latitude >= -40 && latitude <= 35) {
    return language === 'en' ? 'Africa' : '非洲';
  }
  
  // Asia
  if (longitude >= 40 && longitude <= 150 && latitude >= 0 && latitude <= 80) {
    return language === 'en' ? 'Asia' : '亚洲';
  }
  
  // Australia/Oceania
  if (longitude >= 110 && longitude <= 180 && latitude >= -50 && latitude <= 0) {
    return language === 'en' ? 'Oceania' : '大洋洲';
  }
  
  // Antarctica
  if (latitude <= -60) {
    return language === 'en' ? 'Antarctica' : '南极洲';
  }
  
  // Arctic
  if (latitude >= 66.5) {
    return language === 'en' ? 'Arctic' : '北极';
  }
  
  // Fallback
  return language === 'en' ? 'Remote area' : '偏远地区';
}
