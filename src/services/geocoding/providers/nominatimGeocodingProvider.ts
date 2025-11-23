
import { Language } from '../types';
import { GeocodingResult } from '../types/enhancedLocationTypes';
import { cachedReverseGeocode } from '@/utils/cache/geocodingCache';

// Track pending requests to prevent duplicate API calls
const pendingRequests = new Map<string, Promise<GeocodingResult>>();

/**
 * Internal function that performs the actual API call
 */
async function fetchFromAPI(
  latitude: number,
  longitude: number,
  language: Language = 'en',
  retryCount: number = 0
): Promise<GeocodingResult> {
  const maxRetries = 2;
  const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 4000);
  
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=18&addressdetails=1&accept-language=${language}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
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
        throw new Error(`Geocoding API returned ${response.status}`);
      }
      
      const data = await response.json();
      return parseNominatimResponse(data, language);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (retryCount < maxRetries && 
          (fetchError.name === 'AbortError' || 
           fetchError.name === 'TypeError' ||
           fetchError.message?.includes('Load failed'))) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return fetchFromAPI(latitude, longitude, language, retryCount + 1);
      }
      
      throw fetchError;
    }
  } catch (error) {
    if (retryCount >= maxRetries) {
      console.error('Geocoding failed:', error);
    }
    throw error;
  }
}

/**
 * Fetch location details with caching and deduplication
 */
export async function fetchLocationDetails(
  latitude: number,
  longitude: number,
  language: Language = 'en'
): Promise<GeocodingResult> {
  const key = `${latitude.toFixed(6)},${longitude.toFixed(6)},${language}`;
  
  // Check for pending request
  const pending = pendingRequests.get(key);
  if (pending) {
    return pending;
  }

  // Create new request with caching
  const request = cachedReverseGeocode(
    latitude,
    longitude,
    () => fetchFromAPI(latitude, longitude, language)
  ).finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, request);
  return request;
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
