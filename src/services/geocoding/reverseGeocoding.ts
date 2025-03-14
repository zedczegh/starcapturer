
import { Location, Language } from './types';

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
 * Reverse geocode coordinates to get location name
 * @param latitude Latitude
 * @param longitude Longitude
 * @param language Preferred language for results
 * @returns Promise with location name
 */
export async function getLocationNameFromCoordinates(
  latitude: number,
  longitude: number,
  language: Language = 'en'
): Promise<string> {
  try {
    // Attempt to get location name from map provider API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=${language}`
    );
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Format the address based on our structured pattern
    if (data.address) {
      const formattedAddress = formatAddress(data.address, language);
      if (formattedAddress) {
        return formattedAddress;
      }
    }
    
    // Fallbacks if structured formatting didn't work
    if (data.display_name) {
      const parts = data.display_name.split(',');
      // Take first 3-4 parts for a reasonable display
      return parts.slice(0, Math.min(4, parts.length)).join(language === 'en' ? ', ' : '，');
    }
    
    if (data.name) {
      return data.name;
    }
    
    // Last fallback if no name found
    return language === 'en' ? 
      `Location at ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°` : 
      `位置在 ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    // Return formatted coordinates as fallback
    return language === 'en' ? 
      `Location at ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°` : 
      `位置在 ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
  }
}

/**
 * Reverse geocode coordinates to get a Location object
 */
export function reverseGeocode(
  latitude: number,
  longitude: number,
  language: Language = 'en'
): Promise<Location> {
  return getLocationNameFromCoordinates(latitude, longitude, language)
    .then(name => ({
      name,
      latitude,
      longitude
    }));
}
