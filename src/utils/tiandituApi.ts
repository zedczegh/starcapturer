
/**
 * Location services utilities
 */

// Tianditu requires an API key (we use a public test key - replace with your own in production)
const TIANDITU_KEY = "1f2df41008fa6dca06da53a1422935f5";

/**
 * Get location name from coordinates (reverse geocoding)
 * This uses Tianditu service which is available in China
 */
export async function getTiandituLocationName(
  latitude: number,
  longitude: number,
  language: string = 'en'
): Promise<string> {
  try {
    // For safety, ensure coordinates are valid numbers
    if (!isFinite(latitude) || !isFinite(longitude)) {
      return getFormattedLocationString(latitude || 0, longitude || 0);
    }
    
    // Ensure coordinates are within valid ranges
    const validLat = Math.max(-90, Math.min(90, latitude));
    const validLng = ((longitude + 180) % 360 + 360) % 360 - 180;
    
    const langCode = language === 'zh' ? 'c' : 'e'; // c for Chinese, e for English
    
    console.log(`Attempting Tianditu API for reverse geocoding at: ${validLat}, ${validLng}`);
    
    try {
      const response = await fetch(
        `https://api.tianditu.gov.cn/geocoder?postStr={'lon':${validLng},'lat':${validLat},'ver':1}&type=geocode&tk=${TIANDITU_KEY}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          cache: 'no-cache',
          // Shorter timeout to fail faster if API is unavailable
          signal: AbortSignal.timeout(5000)
        }
      );
      
      if (!response.ok) {
        console.warn('Tianditu API response not OK:', response.status, response.statusText);
        return getFormattedLocationString(validLat, validLng);
      }
      
      const data = await response.json();
      console.log('Tianditu geocoding response:', data);
      
      if (data.status === '0' && data.result) {
        // Format the response based on the data structure
        const addressComponent = data.result.addressComponent;
        
        if (addressComponent) {
          const parts = [];
          
          // Add city or county
          if (addressComponent.city) {
            parts.push(addressComponent.city);
          } else if (addressComponent.county) {
            parts.push(addressComponent.county);
          }
          
          // Add province
          if (addressComponent.province && !parts.includes(addressComponent.province)) {
            parts.push(addressComponent.province);
          }
          
          // Add country if different from province and city
          if (addressComponent.country && 
              addressComponent.country !== addressComponent.province && 
              addressComponent.country !== parts[0]) {
            parts.push(addressComponent.country);
          }
          
          if (parts.length > 0) {
            return parts.join(', ');
          }
        }
        
        // Fallback to formatted address
        if (data.result.formatted_address) {
          return data.result.formatted_address;
        }
      }
    } catch (apiError) {
      console.warn('Error with Tianditu API call:', apiError);
    }
    
    // If we reach here, API failed or returned invalid data
    return getFormattedLocationString(validLat, validLng);
  } catch (error) {
    console.error('Error getting location name from Tianditu:', error);
    // Safe fallback even if all coordinates are invalid
    return getFormattedLocationString(latitude || 0, longitude || 0);
  }
}

/**
 * Generate a formatted location string based on coordinates
 */
function getFormattedLocationString(latitude: number, longitude: number): string {
  return `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
}

/**
 * Search for locations by name
 * This uses Tianditu service which is available in China
 */
export async function searchTiandituLocations(
  query: string,
  language: string = 'en'
): Promise<Array<{
  name: string;
  placeDetails: string;
  latitude: number;
  longitude: number;
}>> {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  try {
    const langCode = language === 'zh' ? 'c' : 'e'; // c for Chinese, e for English
    
    console.log(`Searching Tianditu locations for: ${query}`);
    
    try {
      const response = await fetch(
        `https://api.tianditu.gov.cn/search?postStr={'keyWord':'${encodeURIComponent(query)}','level':12,'mapBound':'73.66,3.86,135.05,53.55','queryType':1,'start':0,'count':10}&type=query&tk=${TIANDITU_KEY}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        }
      );
      
      if (!response.ok) {
        console.warn('Tianditu search API response not OK:', response.status, response.statusText);
        return getFallbackSearchResults(query);
      }
      
      const data = await response.json();
      console.log('Tianditu search response:', data);
      
      if (data.status === '0' && data.pois && data.pois.length > 0) {
        // Map the response to our expected format
        return data.pois.map((poi: any) => ({
          name: poi.name || 'Unknown Location',
          placeDetails: poi.address || poi.name || 'Unknown Location',
          latitude: parseFloat(poi.pointY),
          longitude: parseFloat(poi.pointX)
        }));
      }
    } catch (apiError) {
      console.warn('Error with Tianditu search API call:', apiError);
    }
    
    return getFallbackSearchResults(query);
  } catch (error) {
    console.error('Error searching locations with Tianditu:', error);
    return getFallbackSearchResults(query);
  }
}

/**
 * Get some fallback search results for when the API fails
 */
function getFallbackSearchResults(query: string): Array<{
  name: string;
  placeDetails: string;
  latitude: number;
  longitude: number;
}> {
  // For demonstration, return an empty array
  // In a real app, you might want to have some fallback locations
  return [];
}
