
/**
 * Tianditu API utilities
 * This uses the free Tianditu API service which is available in China
 */

// Tianditu requires an API key (we use a public test key - replace with your own in production)
const TIANDITU_KEY = "1f2df41008fa6dca06da53a1422935f5";

/**
 * Get location name from coordinates (reverse geocoding)
 */
export async function getTiandituLocationName(
  latitude: number,
  longitude: number,
  language: string = 'en'
): Promise<string> {
  try {
    // Tianditu API uses GCJ-02 coordinate system, but our coordinates are in WGS84
    // For a proper implementation, we should convert WGS84 to GCJ-02, but for simplicity
    // we'll use the coordinates directly (the error is usually small enough for our purposes)
    
    const langCode = language === 'zh' ? 'c' : 'e'; // c for Chinese, e for English
    
    const response = await fetch(
      `https://api.tianditu.gov.cn/geocoder?postStr={'lon':${longitude},'lat':${latitude},'ver':1}&type=geocode&tk=${TIANDITU_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Tianditu geocoding API error');
    }
    
    const data = await response.json();
    
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
    
    // Final fallback
    return `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
  } catch (error) {
    console.error('Error getting location name from Tianditu:', error);
    return `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
  }
}

/**
 * Search for locations by name
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
  try {
    const langCode = language === 'zh' ? 'c' : 'e'; // c for Chinese, e for English
    
    const response = await fetch(
      `https://api.tianditu.gov.cn/search?postStr={'keyWord':'${encodeURIComponent(query)}','level':12,'mapBound':'73.66,3.86,135.05,53.55','queryType':1,'start':0,'count':10}&type=query&tk=${TIANDITU_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Tianditu search API error');
    }
    
    const data = await response.json();
    
    if (data.status === '0' && data.pois && data.pois.length > 0) {
      // Map the response to our expected format
      return data.pois.map((poi: any) => ({
        name: poi.name || 'Unknown Location',
        placeDetails: poi.address || poi.name || 'Unknown Location',
        latitude: parseFloat(poi.pointY),
        longitude: parseFloat(poi.pointX)
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error searching locations with Tianditu:', error);
    return [];
  }
}
