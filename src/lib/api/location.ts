import { fetchWithTimeout } from './fetchUtils';

/**
 * Get location name from coordinates
 * @param latitude Latitude
 * @param longitude Longitude
 * @param language Language code (default: 'en')
 * @returns Promise with location name
 */
export async function getLocationNameFromCoordinates(
  latitude: number,
  longitude: number,
  language: string = 'en'
): Promise<string> {
  try {
    // Validate coordinates
    if (!isFinite(latitude) || !isFinite(longitude)) {
      throw new Error("Invalid coordinates");
    }
    
    // Use Nominatim for reverse geocoding
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=${language}`;
    
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'AstroQualityApp/1.0'
      }
    }, 5000);
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract location name from response
    if (data && data.display_name) {
      // Parse the display name to get a more user-friendly location name
      const nameParts = data.display_name.split(',');
      
      // If we have an address object with named components, use it
      if (data.address) {
        if (data.address.city) {
          return data.address.city;
        } else if (data.address.town) {
          return data.address.town;
        } else if (data.address.village) {
          return data.address.village;
        } else if (data.address.county) {
          return data.address.county;
        } else if (data.address.state) {
          return data.address.state;
        }
      }
      
      // Otherwise use the first part of the display name
      return nameParts[0].trim();
    }
    
    return "Unknown Location";
  } catch (error) {
    console.error("Error getting location name:", error);
    return "Unknown Location";
  }
}

// Additional functions for location-related operations can be added here
