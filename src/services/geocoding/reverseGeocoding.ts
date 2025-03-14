
import { Location, Language } from './types';

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
    
    // Format the address based on what data is available
    let locationName = '';
    
    if (data.name) {
      locationName = data.name;
    } else if (data.address) {
      const address = data.address;
      
      if (address.city || address.town || address.village) {
        locationName = address.city || address.town || address.village;
      } else if (address.county) {
        locationName = address.county;
      } else if (address.state) {
        locationName = address.state;
      } else if (address.country) {
        locationName = 
          language === 'en' ? 
            `Location in ${address.country}` : 
            `${address.country}中的位置`;
      }
    }
    
    if (!locationName) {
      // Fallback if no name found
      locationName = 
        language === 'en' ? 
          `Location at ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°` : 
          `位置在 ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
    }
    
    return locationName;
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
