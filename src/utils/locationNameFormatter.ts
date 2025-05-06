
import { Language } from "@/contexts/LanguageContext";
import { convertToSimplifiedChinese } from "./chineseCharacterConverter";

/**
 * Extract the nearest town name from location information
 * @param locationName Full location name from mapping services
 * @param description Optional location description
 * @param language Current app language
 * @returns Formatted town name
 */
export function extractNearestTownName(
  locationName: string,
  description?: string,
  language: Language = 'en'
): string {
  // If location is empty or contains GPS coordinates, return a default
  if (!locationName || 
      locationName.includes("°") || 
      locationName.includes("Location at") ||
      locationName.includes("位置在")) {
    return language === 'en' ? 'Remote area' : '偏远地区';
  }

  // Don't truncate detailed location information
  // This ensures we keep full address details in both languages
  if (locationName.includes(',') && locationName.split(',').length >= 3) {
    // Convert to simplified Chinese if needed
    return language === 'zh' ? convertToSimplifiedChinese(locationName) : locationName;
  }

  // Extract useful information from the description if available
  if (description && description.length > 0) {
    const nearPattern = language === 'en' ? 
      /near\s+([^,\.]+)/i : 
      /(靠近|附近)\s*([^，。]+)/i;
    
    const match = description.match(nearPattern);
    if (match) {
      const result = language === 'en' ? 
        `Near ${match[1].trim()}` : 
        `${match[1]}${match[2].trim()}`;
      
      // Convert to simplified Chinese if needed
      return language === 'zh' ? convertToSimplifiedChinese(result) : result;
    }
    
    // If description has detailed information, use it
    if (description.includes(',') && description.split(',').length >= 3) {
      // Convert to simplified Chinese if needed
      return language === 'zh' ? convertToSimplifiedChinese(description) : description;
    }
  }
  
  // If we can't extract anything more specific, return the full name
  // Convert to simplified Chinese if needed
  return language === 'zh' ? convertToSimplifiedChinese(locationName) : locationName;
}

/**
 * Get a general regional name based on coordinates
 * @param latitude Latitude
 * @param longitude Longitude
 * @param language Current app language
 * @returns Regional name
 */
export function getRegionalName(
  latitude: number,
  longitude: number,
  language: Language = 'en'
): string {
  // Simple region determination based on coordinates
  // China regions
  if (latitude >= 20 && latitude <= 45 && longitude >= 75 && longitude <= 130) {
    if (latitude > 40) {
      if (longitude < 110) {
        return language === 'en' ? 'Northwest China' : '中国西北';
      } else {
        return language === 'en' ? 'Northeast China' : '中国东北';
      }
    } else if (latitude > 30) {
      if (longitude < 105) {
        return language === 'en' ? 'Western China' : '中国西部';
      } else if (longitude > 118) {
        return language === 'en' ? 'East China' : '中国东部';
      } else {
        return language === 'en' ? 'Central China' : '中国中部';
      }
    } else {
      if (longitude < 105) {
        return language === 'en' ? 'Southwest China' : '中国西南';
      } else {
        return language === 'en' ? 'South China' : '中国南部';
      }
    }
  }
  
  // Major global regions
  if (latitude >= 30 && latitude <= 70 && longitude >= -10 && longitude <= 40) {
    return language === 'en' ? 'Europe' : '欧洲';
  }
  if (latitude >= 25 && latitude <= 50 && longitude >= -130 && longitude <= -65) {
    return language === 'en' ? 'North America' : '北美洲';
  }
  if (latitude >= -40 && latitude <= 5 && longitude >= -80 && longitude <= -30) {
    return language === 'en' ? 'South America' : '南美洲';
  }
  if (latitude >= -10 && latitude <= 35 && longitude >= 0 && longitude <= 50) {
    return language === 'en' ? 'Africa' : '非洲';
  }
  if (latitude >= -50 && latitude <= -10 && longitude >= 110 && longitude <= 180) {
    return language === 'en' ? 'Oceania' : '大洋洲';
  }
  
  // Default for unknown regions
  return language === 'en' ? 'Remote area' : '偏远地区';
}

/**
 * Format a location name for display
 * @param locationName Raw location name
 * @param language Current app language
 * @returns Formatted location name for display
 */
export function formatLocationName(
  locationName: string,
  language: Language = 'en'
): string {
  // If location is empty, return a default
  if (!locationName) {
    return language === 'en' ? 'Unknown location' : '未知位置';
  }

  // If location contains GPS coordinates, use a generic name
  if (locationName.includes("°") || 
      locationName.includes("Location at") ||
      locationName.includes("位置在")) {
    return language === 'en' ? 'Remote area' : '偏远地区';
  }

  // DON'T truncate detailed location names
  // This is the key change - we're no longer extracting just the first part
  // Keep the full detailed name, regardless of commas
  
  // Handle special case for calculated locations
  const locationMatch = locationName.match(/calc-loc-(\d+)/);
  if (locationMatch) {
    const locationNumber = parseInt(locationMatch[1]) || 1;
    return language === 'en' 
      ? `Potential ideal dark site ${locationNumber}`
      : `潜在理想暗夜地点 ${locationNumber}`;
  }

  // Return the full location name with all details, converting to simplified Chinese if needed
  return language === 'zh' ? convertToSimplifiedChinese(locationName) : locationName;
}
