
import { Language } from '../types';
import { GeocodingResult } from '../types/enhancedLocationTypes';

/**
 * Fetch location details from Nominatim OpenStreetMap API
 * @param latitude Latitude
 * @param longitude Longitude
 * @param language Preferred language for results
 * @returns Promise with geocoding result
 */
export async function fetchLocationDetails(
  latitude: number,
  longitude: number,
  language: Language = 'en'
): Promise<GeocodingResult> {
  try {
    // Build URL for Nominatim reverse geocoding
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=18&addressdetails=1&accept-language=${language}`;
    
    // Fetch with appropriate headers to respect usage policy
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'StarCaptureApp/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Geocoding API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Extract and normalize the address components
    return parseNominatimResponse(data, language);
  } catch (error) {
    console.error('Error fetching location details:', error);
    throw error;
  }
}

/**
 * Parse the Nominatim response into our standard format
 */
function parseNominatimResponse(data: any, language: Language): GeocodingResult {
  if (!data || !data.address) {
    return { formattedName: data.display_name || '' };
  }
  
  const address = data.address;
  
  return {
    streetName: address.road || address.pedestrian || address.footway,
    townName: address.town || address.village || address.hamlet || address.locality,
    cityName: address.city,
    countyName: address.county,
    stateName: address.state,
    countryName: address.country,
    postalCode: address.postcode,
    formattedName: data.display_name,
    // For Chinese language, try to provide Chinese specific names
    chineseName: language === 'zh' ? (data.namedetails?.name_zh || data.namedetails?.name || data.display_name) : undefined
  };
}
