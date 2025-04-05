import { normalizeLongitude } from './coordinates';
import { Language } from '@/services/geocoding/types';

/**
 * Format location address based on language-specific patterns
 * @param address Address object from geocoding service
 * @param language Preferred language
 * @returns Formatted address string
 */
function formatAddress(address: any, language: Language): string {
  if (!address) return "";
  
  const parts = [];
  
  if (language === 'en') {
    // English format: town, county, state, country, zip code
    if (address.village || address.town || address.hamlet || address.suburb) {
      parts.push(address.village || address.town || address.hamlet || address.suburb);
    }
    if (address.city) {
      parts.push(address.city);
    }
    if (address.county) {
      parts.push(address.county);
    }
    if (address.state) {
      parts.push(address.state);
    }
    if (address.country) {
      parts.push(address.country);
    }
    if (address.postcode) {
      parts.push(address.postcode);
    }
  } else {
    // Chinese format: 区，市，省，国家，邮编
    if (address.suburb || address.village || address.hamlet) {
      parts.push(address.suburb || address.village || address.hamlet);
    }
    if (address.town) {
      parts.push(address.town);
    }
    if (address.city) {
      parts.push(address.city);
    }
    if (address.county) {
      parts.push(address.county);
    }
    if (address.state) {
      parts.push(address.state);
    }
    if (address.country) {
      parts.push(address.country);
    }
    if (address.postcode) {
      parts.push(address.postcode);
    }
  }
  
  // Remove duplicates while preserving order
  const uniqueParts = [...new Set(parts)];
  
  return uniqueParts.join(language === 'en' ? ', ' : '，');
}

/**
 * Process and filter location data
 * @param locations Array of location data
 * @returns Filtered and processed array
 */
export function processLocationData(locations: any[]): any[] {
  if (!locations || !Array.isArray(locations)) return [];
  
  return locations.filter(loc => {
    // Skip locations without coordinates
    if (!loc.latitude || !loc.longitude) return false;
    
    // Add default name if missing
    if (!loc.name) {
      loc.name = `Location at ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`;
    }
    
    // More processing logic...
    return true;
  });
}

/**
 * Sort locations by specified criteria
 * @param locations Array of location data
 * @param sortBy Sort criteria 
 * @returns Sorted array
 */
export function sortLocations(locations: any[], sortBy: string = 'distance'): any[] {
  if (!locations || !Array.isArray(locations)) return [];
  
  return [...locations].sort((a, b) => {
    // Ensure locations have names
    if (!a.name) a.name = `Location at ${a.latitude?.toFixed(4) || '?'}, ${a.longitude?.toFixed(4) || '?'}`;
    if (!b.name) b.name = `Location at ${b.latitude?.toFixed(4) || '?'}, ${b.longitude?.toFixed(4) || '?'}`;
    
    // Sort by the specified criteria
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    
    if (sortBy === 'bortleScale') {
      return (a.bortleScale || 5) - (b.bortleScale || 5);
    }
    
    // Default to distance
    return (a.distance || 0) - (b.distance || 0);
  });
}

/**
 * Enhanced function to get location name from coordinates
 * Now with better name resolution for places beyond Beijing and Hong Kong
 */
export async function getLocationNameFromCoordinates(
  latitude: number, 
  longitude: number,
  language: Language = 'en'
): Promise<string> {
  try {
    // Normalize coordinates
    const validLat = Math.max(-90, Math.min(90, latitude));
    const validLng = normalizeLongitude(longitude);
    
    // First try open API for reverse geocoding
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${validLat}&lon=${validLng}&format=json&accept-language=${language}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SIQSCalculatorApp'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Format address in the structured pattern
        if (data.address) {
          const formattedAddress = formatAddress(data.address, language);
          if (formattedAddress) {
            return formattedAddress;
          }
        }
        
        // Fallbacks if structured formatting didn't work
        if (data.display_name) {
          const parts = data.display_name.split(',');
          return parts.slice(0, Math.min(4, parts.length)).join(language === 'en' ? ', ' : '，');
        }
        
        if (data.name) {
          return data.name;
        }
      }
    } catch (error) {
      console.error("Error using Nominatim API:", error);
    }
    
    // Fallback to our database
    const { findClosestKnownLocation } = await import('../../utils/locationUtils');
    const closestLocation = findClosestKnownLocation(validLat, validLng);
    
    // If we're close to a known location, use its name or "Near X"
    if (closestLocation.distance <= 20) {
      return closestLocation.name;
    } else if (closestLocation.distance <= 100) {
      return language === 'en' 
        ? `Near ${closestLocation.name}` 
        : `${closestLocation.name}附近`;
    }
    
    // Last resort - use major city or region names based on approximate location
    const china = {
      north: ["Beijing Region", "北京地区"],
      northeast: ["Northeast China", "中国东北"],
      east: ["East China", "中国东部"],
      south: ["South China", "中国南部"],
      central: ["Central China", "中国中部"],
      west: ["Western China", "中国西部"],
      northwest: ["Northwest China", "中国西北"],
      southwest: ["Southwest China", "中国西南"],
    };
    
    // Simple region determination based on coordinates
    let region;
    if (validLat > 40) {
      if (validLng < 110) region = china.northwest;
      else region = china.northeast;
    } else if (validLat > 30) {
      if (validLng < 105) region = china.west;
      else if (validLng > 118) region = china.east;
      else region = china.central;
    } else {
      if (validLng < 105) region = china.southwest;
      else region = china.south;
    }
    
    return language === 'en' ? region[0] : region[1];
  } catch (error) {
    console.error('Error getting location name:', error);
    return language === 'en' 
      ? `Location at ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°` 
      : `位置在 ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
  }
}
