
import { Location, Language } from "./types";

/**
 * Get location name for given coordinates
 * @param latitude Geographic latitude
 * @param longitude Geographic longitude
 * @param language User's preferred language
 * @returns Location data including name
 */
export async function getLocationForCoordinates(
  latitude: number,
  longitude: number,
  language: Language = "en"
): Promise<Location | null> {
  try {
    // Validate coordinates
    if (!isFinite(latitude) || !isFinite(longitude)) {
      throw new Error("Invalid coordinates provided");
    }

    // Format for API query
    const lat = latitude.toFixed(6);
    const lng = longitude.toFixed(6);
    
    // First try our own API endpoint
    try {
      const response = await fetch(
        `https://api.example.com/geocode/reverse?lat=${lat}&lng=${lng}&lang=${language}`
      );
      
      const data = await response.json();
      if (data && data.success && data.result) {
        return {
          name: data.result.name || `${lat}, ${lng}`,
          latitude,
          longitude
        };
      }
    } catch (error) {
      console.warn("Failed to fetch from primary geocoding API:", error);
      // Continue to fallback methods
    }
    
    // Fallback to generic coordinates
    return {
      name: language === "en" 
        ? `Location (${lat}, ${lng})` 
        : `位置 (${lat}, ${lng})`,
      latitude,
      longitude
    };
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return null;
  }
}
