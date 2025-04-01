
/**
 * Utility functions for formatting location names in consistent ways
 * Includes regional naming format for remote locations
 */

import type { Language } from '@/services/geocoding/types';

/**
 * Format a location name for display, handling special cases
 * @param name Original location name
 * @param language Current UI language
 * @returns Formatted location name
 */
export function formatLocationName(name: string, language: Language = 'en'): string {
  if (!name) return language === 'en' ? 'Unknown location' : '未知位置';
  
  // Handle special cases like coordinates in the name
  if (name.includes('°') || 
      name.includes('Location at') || 
      name.includes('位置在')) {
    return language === 'en' ? 'Remote location' : '偏远地区';
  }
  
  // Clean up common formatting issues
  const formattedName = name
    .replace(/^location\s+at\s+/i, '')
    .replace(/^位置在\s+/, '')
    .replace(/\s+\(\d+\.\d+,\s*\d+\.\d+\)$/, '');
  
  return formattedName;
}

/**
 * Extract nearest town name from location name and description
 * @param name Location name
 * @param description Location description (optional)
 * @param language Current UI language
 * @returns Extracted town name
 */
export function extractNearestTownName(name: string, description?: string, language: Language = 'en'): string {
  if (!name) return language === 'en' ? 'Unknown location' : '未知位置';
  
  // Remove coordinates and extra details from name
  let cleanName = name
    .replace(/\s*\(\d+\.\d+,\s*\d+\.\d+\)\s*$/, '')
    .replace(/^Location\s+at\s+/i, '')
    .replace(/^位置在\s+/, '');
  
  // Handle cases where the name is just coordinates
  if (name.includes('°') || cleanName.match(/^\d+\.\d+,\s*\d+\.\d+$/)) {
    // Try to extract location from description if available
    if (description) {
      if (description.includes('near ')) {
        const nearMatch = description.match(/near\s+([^,\.]+)/i);
        if (nearMatch && nearMatch[1]) {
          return nearMatch[1].trim();
        }
      }
      
      if (language === 'zh' && description.includes('靠近')) {
        const nearMatch = description.match(/靠近\s+([^,\.，。]+)/i);
        if (nearMatch && nearMatch[1]) {
          return nearMatch[1].trim();
        }
      }
    }
    
    // Return regional name as fallback
    return language === 'en' ? 'Remote area' : '偏远地区';
  }
  
  // Extract town name from "near X" patterns in the name
  if (cleanName.includes(' near ')) {
    const nearParts = cleanName.split(' near ');
    if (nearParts.length > 1) {
      return nearParts[1].trim();
    }
  }
  
  if (language === 'zh' && cleanName.includes('靠近')) {
    const nearParts = cleanName.split('靠近');
    if (nearParts.length > 1) {
      return nearParts[1].trim();
    }
  }
  
  return cleanName;
}

/**
 * Get a regional name based on coordinates (e.g., "Northwest Yunnan")
 * Useful for remote areas without specific place names
 * @param latitude Latitude
 * @param longitude Longitude
 * @param language Current UI language
 * @returns Regional name like "Northwest Yunnan" or "Central Tibet"
 */
export function getRegionalName(latitude: number, longitude: number, language: Language = 'en'): string {
  // Default fallback
  const defaultName = language === 'en' ? 'Remote area' : '偏远地区';
  
  try {
    // Basic validation
    if (!isFinite(latitude) || !isFinite(longitude)) {
      return defaultName;
    }
    
    // China regions
    if (longitude > 73 && longitude < 135 && latitude > 18 && latitude < 54) {
      // Tibet region
      if (longitude > 78 && longitude < 95 && latitude > 27 && latitude < 37) {
        const direction = getDirectionName(latitude, longitude, 31.5, 88, language);
        return language === 'en' ? `${direction} Tibet` : `${direction}藏区`;
      }
      
      // Xinjiang region
      if (longitude > 75 && longitude < 95 && latitude > 36 && latitude < 50) {
        const direction = getDirectionName(latitude, longitude, 43, 87, language);
        return language === 'en' ? `${direction} Xinjiang` : `${direction}新疆`;
      }
      
      // Yunnan region
      if (longitude > 97 && longitude < 106 && latitude > 21 && latitude < 29) {
        const direction = getDirectionName(latitude, longitude, 25, 102, language);
        return language === 'en' ? `${direction} Yunnan` : `${direction}云南`;
      }
      
      // Sichuan region
      if (longitude > 97 && longitude < 108 && latitude > 26 && latitude < 34) {
        const direction = getDirectionName(latitude, longitude, 30, 103, language);
        return language === 'en' ? `${direction} Sichuan` : `${direction}四川`;
      }
      
      // Inner Mongolia
      if (longitude > 107 && longitude < 126 && latitude > 37 && latitude < 46) {
        const direction = getDirectionName(latitude, longitude, 42, 115, language);
        return language === 'en' ? `${direction} Inner Mongolia` : `${direction}内蒙古`;
      }
      
      // Qinghai region
      if (longitude > 89 && longitude < 103 && latitude > 31 && latitude < 39) {
        const direction = getDirectionName(latitude, longitude, 35, 96, language);
        return language === 'en' ? `${direction} Qinghai` : `${direction}青海`;
      }
    }
    
    // United States regions
    if (longitude > -130 && longitude < -65 && latitude > 24 && latitude < 50) {
      // Washington state
      if (longitude > -125 && longitude < -117 && latitude > 45 && latitude < 49) {
        const direction = getDirectionName(latitude, longitude, 47, -122, language);
        return language === 'en' ? `${direction} Washington` : `${direction}华盛顿州`;
      }
      
      // California
      if (longitude > -125 && longitude < -114 && latitude > 32 && latitude < 42) {
        const direction = getDirectionName(latitude, longitude, 37, -120, language);
        return language === 'en' ? `${direction} California` : `${direction}加利福尼亚`;
      }
      
      // Colorado
      if (longitude > -109 && longitude < -102 && latitude > 37 && latitude < 41) {
        const direction = getDirectionName(latitude, longitude, 39, -105, language);
        return language === 'en' ? `${direction} Colorado` : `${direction}科罗拉多`;
      }
      
      // Texas
      if (longitude > -106 && longitude < -93 && latitude > 26 && latitude < 36) {
        const direction = getDirectionName(latitude, longitude, 31, -100, language);
        return language === 'en' ? `${direction} Texas` : `${direction}德克萨斯`;
      }
    }
    
    // Europe regions
    if (longitude > -12 && longitude < 40 && latitude > 36 && latitude < 60) {
      // Norway
      if (longitude > 4 && longitude < 32 && latitude > 58 && latitude < 72) {
        const direction = getDirectionName(latitude, longitude, 65, 15, language);
        return language === 'en' ? `${direction} Norway` : `${direction}挪威`;
      }
      
      // Scotland
      if (longitude > -8 && longitude < 0 && latitude > 54 && latitude < 61) {
        const direction = getDirectionName(latitude, longitude, 57, -4, language);
        return language === 'en' ? `${direction} Scotland` : `${direction}苏格兰`;
      }
    }
    
    // Australia regions
    if (longitude > 113 && longitude < 155 && latitude < 0 && latitude > -44) {
      const direction = getDirectionName(latitude, longitude, -25, 134, language);
      return language === 'en' ? `${direction} Australia` : `${direction}澳大利亚`;
    }
    
    // South America
    if (longitude > -82 && longitude < -34 && latitude > -56 && latitude < 13) {
      // Patagonia
      if (longitude > -76 && longitude < -64 && latitude < -40 && latitude > -56) {
        const direction = getDirectionName(latitude, longitude, -45, -70, language);
        return language === 'en' ? `${direction} Patagonia` : `${direction}巴塔哥尼亚`;
      }
    }
    
    // If we couldn't identify a specific region, return the default
    return defaultName;
  } catch (error) {
    console.error("Error in getRegionalName:", error);
    return defaultName;
  }
}

/**
 * Helper function to get cardinal direction name based on point relative to center
 * @param lat Latitude
 * @param lng Longitude
 * @param centerLat Center latitude of region
 * @param centerLng Center longitude of region
 * @param language Current UI language
 * @returns Cardinal direction name (North, Northeast, etc.)
 */
function getDirectionName(
  lat: number, 
  lng: number, 
  centerLat: number, 
  centerLng: number, 
  language: Language = 'en'
): string {
  const latDiff = lat - centerLat;
  const lngDiff = lng - centerLng;
  
  // Determine direction based on relative position
  let direction = '';
  
  if (latDiff > 0) {
    direction = language === 'en' ? 'North' : '北';
  } else if (latDiff < 0) {
    direction = language === 'en' ? 'South' : '南';
  }
  
  if (lngDiff > 0) {
    direction += language === 'en' ? (direction ? 'east' : 'East') : '东';
  } else if (lngDiff < 0) {
    direction += language === 'en' ? (direction ? 'west' : 'West') : '西';
  }
  
  // If no direction was determined (right at center), use "Central"
  if (!direction) {
    direction = language === 'en' ? 'Central' : '中部';
  }
  
  return direction;
}
