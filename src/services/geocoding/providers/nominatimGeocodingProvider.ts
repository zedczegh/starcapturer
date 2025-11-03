
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
  language: Language = 'en',
  retryCount: number = 0
): Promise<GeocodingResult> {
  const maxRetries = 2;
  const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 4000); // Exponential backoff, max 4s
  
  try {
    // Build URL for Nominatim reverse geocoding
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=18&addressdetails=1&accept-language=${language}`;
    
    // Fetch with appropriate headers and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'StarCaptureApp/1.0',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Geocoding API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract and normalize the address components
      return parseNominatimResponse(data, language);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Retry on network errors or timeouts
      if (retryCount < maxRetries && 
          (fetchError.name === 'AbortError' || 
           fetchError.name === 'TypeError' ||
           fetchError.message?.includes('Load failed'))) {
        console.warn(`Nominatim API failed, retrying (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return fetchLocationDetails(latitude, longitude, language, retryCount + 1);
      }
      
      throw fetchError;
    }
  } catch (error) {
    // Only log if this was the final retry
    if (retryCount >= maxRetries) {
      console.error('Error fetching location details (all retries exhausted):', error);
    }
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
