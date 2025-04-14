
import { Language } from './types';
import { findNearestTown } from '@/utils/nearestTownCalculator';
import { formatDistance } from '@/utils/location/formatDistance';

/**
 * Enhanced response from reverse geocoding including detailed address components
 */
export interface EnhancedLocationDetails {
  name: string;
  formattedName: string;
  streetName?: string;
  townName?: string;
  cityName?: string;
  countyName?: string;
  stateName?: string;
  countryName?: string;
  postalCode?: string;
  distance?: number;
  formattedDistance?: string;
  latitude: number;
  longitude: number;
  detailedName?: string;
}

/**
 * Cache interface for storing geocoding results
 */
interface GeocodeCache {
  [key: string]: {
    timestamp: number;
    data: EnhancedLocationDetails;
  }
}

// In-memory cache to prevent excessive API calls
const geocodeCache: GeocodeCache = {};
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Normalize coordinates for consistent lookup and caching
 */
function normalizeCoordinates(latitude: number, longitude: number): [number, number] {
  const lat = Math.max(-90, Math.min(90, latitude));
  const lng = ((longitude + 180) % 360 + 360) % 360 - 180;
  return [parseFloat(lat.toFixed(4)), parseFloat(lng.toFixed(4))];
}

/**
 * Generate a cache key for the given coordinates and language
 */
function generateCacheKey(latitude: number, longitude: number, language: Language): string {
  const [normalizedLat, normalizedLng] = normalizeCoordinates(latitude, longitude);
  return `geocode_${normalizedLat}_${normalizedLng}_${language}`;
}

/**
 * Format address components based on language preferences
 */
function formatAddressComponents(
  components: Record<string, string>,
  language: Language
): string {
  const parts: string[] = [];
  
  if (language === 'en') {
    // English format: street, town/village, city, county, state, country
    if (components.street) parts.push(components.street);
    if (components.town || components.village) parts.push(components.town || components.village);
    if (components.city) parts.push(components.city);
    if (components.county) parts.push(components.county);
    if (components.state) parts.push(components.state);
    if (components.country) parts.push(components.country);
  } else {
    // Chinese format: country, state, county, city, town, street
    const order = ['country', 'state', 'county', 'city', 'town', 'village', 'street'];
    for (const key of order) {
      if (components[key]) parts.push(components[key]);
    }
  }
  
  // Remove duplicates while preserving order
  const uniqueParts = [...new Set(parts)];
  
  // Join with appropriate separator
  return uniqueParts.join(language === 'en' ? ', ' : '');
}

/**
 * Enhanced reverse geocoding service that combines multiple data sources
 * to get detailed address information from coordinates
 */
export async function getEnhancedLocationDetails(
  latitude: number,
  longitude: number,
  language: Language = 'en'
): Promise<EnhancedLocationDetails> {
  try {
    // Validate coordinates
    if (!isFinite(latitude) || !isFinite(longitude)) {
      throw new Error("Invalid coordinates provided");
    }
    
    const [normalizedLat, normalizedLng] = normalizeCoordinates(latitude, longitude);
    const cacheKey = generateCacheKey(normalizedLat, normalizedLng, language);
    
    // Check cache first
    const now = Date.now();
    if (geocodeCache[cacheKey] && (now - geocodeCache[cacheKey].timestamp < CACHE_EXPIRY)) {
      console.log(`Using cached geocoding data for ${normalizedLat}, ${normalizedLng}`);
      return geocodeCache[cacheKey].data;
    }
    
    // Get nearest town info from our internal database first
    const nearestTownInfo = findNearestTown(normalizedLat, normalizedLng, language);
    
    // Start building our result with the nearest town info
    const result: EnhancedLocationDetails = {
      name: nearestTownInfo.townName,
      formattedName: nearestTownInfo.detailedName || nearestTownInfo.townName,
      townName: nearestTownInfo.townName,
      cityName: nearestTownInfo.city,
      countyName: nearestTownInfo.county,
      distance: nearestTownInfo.distance,
      formattedDistance: nearestTownInfo.formattedDistance,
      detailedName: nearestTownInfo.detailedName,
      latitude: normalizedLat,
      longitude: normalizedLng
    };
    
    // Try to enhance with OpenStreetMap Nominatim API for more detailed data like street names
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${normalizedLat}&lon=${normalizedLng}&format=json&accept-language=${language}`;
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'AstroSpotApp/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.address) {
          const addressComponents: Record<string, string> = {};
          const address = data.address;
          
          // Extract address components
          if (address.road || address.pedestrian || address.footway) {
            addressComponents.street = address.road || address.pedestrian || address.footway;
          }
          
          if (address.village || address.town || address.suburb || address.hamlet) {
            addressComponents.town = address.village || address.town || address.suburb || address.hamlet;
          }
          
          if (address.city) {
            addressComponents.city = address.city;
          }
          
          if (address.county) {
            addressComponents.county = address.county;
          }
          
          if (address.state) {
            addressComponents.state = address.state;
          }
          
          if (address.country) {
            addressComponents.country = address.country;
          }
          
          if (address.postcode) {
            addressComponents.postcode = address.postcode;
          }
          
          // Update our result with the enhanced data
          result.streetName = addressComponents.street;
          result.townName = addressComponents.town || result.townName;
          result.cityName = addressComponents.city || result.cityName;
          result.countyName = addressComponents.county || result.countyName;
          result.stateName = addressComponents.state;
          result.countryName = addressComponents.country;
          result.postalCode = addressComponents.postcode;
          
          // Generate a better formatted name with the detailed components
          const formattedName = formatAddressComponents(addressComponents, language);
          if (formattedName) {
            result.formattedName = formattedName;
          }
        }
      }
    } catch (error) {
      console.warn("Error enhancing location with Nominatim API:", error);
      // Continue with what we have from our database
    }
    
    // Cache the result
    geocodeCache[cacheKey] = {
      timestamp: now,
      data: result
    };
    
    return result;
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    
    // Return a fallback with minimal information
    return {
      name: language === 'en' ? 
        `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : 
        `位置 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      formattedName: language === 'en' ? 
        `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : 
        `位置 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      latitude,
      longitude
    };
  }
}

/**
 * Additional utility to get street-level location information
 */
export async function getStreetLevelLocation(
  latitude: number,
  longitude: number,
  language: Language = 'en'
): Promise<{
  streetName?: string;
  fullAddress: string;
}> {
  // Get the enhanced location details
  const details = await getEnhancedLocationDetails(latitude, longitude, language);
  
  // Return a structured response focusing on street-level details
  return {
    streetName: details.streetName,
    fullAddress: details.formattedName
  };
}
