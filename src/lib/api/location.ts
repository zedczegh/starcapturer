import { normalizeLongitude } from './coordinates';
import { Language } from '@/services/geocoding/types';
import { findClosestKnownLocation } from '@/utils/locationUtils';

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
    
    // Fallback to our database - now using the imported function
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
