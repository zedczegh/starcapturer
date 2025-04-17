
import { Language } from "./types";

/**
 * Get location name for coordinates
 * @param latitude Latitude
 * @param longitude Longitude
 * @param language Preferred language (en or zh)
 * @returns Location name or null if not found
 */
export async function getLocationNameForCoordinates(
  latitude: number,
  longitude: number,
  language: Language = 'en'
): Promise<string | null> {
  try {
    // Use Nominatim API for reverse geocoding
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=${language}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AstroApp/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract display name from response
    if (data && data.display_name) {
      // Simplify display name to make it shorter
      const parts = data.display_name.split(',');
      if (parts.length > 3) {
        return `${parts[0]}, ${parts[parts.length - 2]}`;
      }
      return data.display_name;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting location name:", error);
    return null;
  }
}
