
import { Language } from "@/contexts/LanguageContext";
import { calculateDistance } from "@/utils/mapUtils";
import { convertToSimplifiedChinese } from "@/utils/chineseCharacterConverter";

/**
 * Interface for the location cache service
 */
export interface LocationCacheService {
  setCachedData: (key: string, data: any) => void;
  getCachedData: (key: string) => any;
}

/**
 * Normalize longitude to be within -180 to 180 degrees
 */
export function normalizeLongitude(lng: number): number {
  return ((lng + 180) % 360 + 360) % 360 - 180;
}

/**
 * Get a friendly location name for coordinates
 * Enhanced with detailed location information for both English and Chinese
 */
export async function getLocationNameForCoordinates(
  lat: number, 
  lng: number, 
  language: Language = "en",
  cacheService?: LocationCacheService
): Promise<string> {
  // Normalize coordinates
  const validLat = Math.max(-90, Math.min(90, lat));
  const validLng = normalizeLongitude(lng);
  
  // Create cache key - round to 4 decimal places (~11m precision)
  const cacheKey = `location_name_${validLat.toFixed(4)}_${validLng.toFixed(4)}_${language}`;
  
  // Try to get from cache first
  if (cacheService) {
    const cached = cacheService.getCachedData(cacheKey);
    if (cached && cached.name) {
      console.log("Using cached location name:", cached.name);
      return cached.name;
    }
  }
  
  // Mobile-optimized timeout - shorter to prevent UI hanging
  const timeoutPromise = new Promise<string>((_, reject) => {
    setTimeout(() => {
      reject(new Error("Location name lookup timed out"));
    }, 8000); // 8 seconds timeout
  });
  
  try {
    // API call with retry logic for mobile reliability
    const fetchWithRetry = async (retries = 2): Promise<string> => {
      try {
        // Use zoom=14 for detailed results in both languages
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${validLat}&lon=${validLng}&format=json&zoom=14&accept-language=${language}&addressdetails=1`;
        
        const response = await fetch(url, {
          headers: {
            "Accept": "application/json",
            "User-Agent": "StarCapture Astronomy App (https://starcapture.app)"
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Build a detailed location name using address components
        let name = "";
        
        // More structured approach to building detailed names
        if (data.address) {
          // Build name from address components
          const addr = data.address;
          const parts = [];
          
          // Start with the most specific location components
          // For both English and Chinese, build a rich detailed address
          if (addr.road || addr.pedestrian || addr.footway) {
            parts.push(addr.road || addr.pedestrian || addr.footway);
          }
          
          if (addr.neighbourhood || addr.suburb) {
            parts.push(addr.neighbourhood || addr.suburb);
          }
          
          if (addr.village || addr.town || addr.city) {
            parts.push(addr.village || addr.town || addr.city);
          }
          
          if (addr.county && !parts.includes(addr.county)) {
            parts.push(addr.county);
          }
          
          if (addr.state && !parts.includes(addr.state)) {
            parts.push(addr.state);
          }
          
          // Only add country for locations outside the current region
          if (addr.country && parts.length < 2) {
            parts.push(addr.country);
          }
          
          // Join with appropriate separator for the language
          name = parts.join(language === 'en' ? ', ' : '，');
          
          // Convert traditional Chinese to simplified Chinese if language is Chinese
          if (language === 'zh') {
            name = convertToSimplifiedChinese(name);
          }
        }
        
        // If we couldn't build a detailed name, use display_name
        if (!name && data.display_name) {
          name = language === 'zh' ? convertToSimplifiedChinese(data.display_name) : data.display_name;
        }
        
        // Last resort - use coordinates
        if (!name) {
          const latDir = lat >= 0 ? "N" : "S";
          const lngDir = lng >= 0 ? "E" : "W";
          
          name = `${Math.abs(validLat).toFixed(2)}° ${latDir}, ${Math.abs(validLng).toFixed(2)}° ${lngDir}`;
        }
        
        // Cache the result
        if (cacheService && name) {
          cacheService.setCachedData(cacheKey, { name, timestamp: Date.now() });
        }
        
        return name;
      } catch (error) {
        if (retries > 0) {
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchWithRetry(retries - 1);
        }
        throw error;
      }
    };
    
    // Race between fetch and timeout
    const locationName = await Promise.race([
      fetchWithRetry(),
      timeoutPromise
    ]);
    
    return locationName;
  } catch (error) {
    console.error("Error getting location name:", error);
    
    // When API fails, fall back to approximate name based on coordinates
    const latDir = validLat >= 0 ? "N" : "S";
    const lngDir = validLng >= 0 ? "E" : "W";
    const fallbackName = `${Math.abs(validLat).toFixed(2)}° ${latDir}, ${Math.abs(validLng).toFixed(2)}° ${lngDir}`;
    
    return fallbackName;
  }
}

/**
 * Check if two locations are approximately the same
 */
export function isSameLocation(loc1: {latitude: number, longitude: number}, loc2: {latitude: number, longitude: number}, thresholdKm = 0.5): boolean {
  if (!loc1 || !loc2) return false;
  
  return calculateDistance(loc1.latitude, loc1.longitude, loc2.latitude, loc2.longitude) <= thresholdKm;
}
