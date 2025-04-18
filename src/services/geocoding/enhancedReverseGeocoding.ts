
import { Language } from './types';
import { EnhancedLocationDetails } from './types/enhancedLocationTypes';
import { fetchLocationDetails } from './providers/nominatimGeocodingProvider';
import { GeocodeCache, addToCache, getFromCache, cleanupCache } from './cache/geocodingCache';
import { normalizeCoordinates } from './utils/coordinateUtils';
import { findNearestTown } from '@/utils/nearestTownCalculator';
import { isWaterLocation } from '@/utils/locationWaterCheck';
import { formatAddressComponents } from './formatters/addressFormatter';

/**
 * Enhanced reverse geocoding service that combines multiple data sources
 * to get detailed address information from coordinates.
 * Optimized for faster response times and better water detection.
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
    const cacheKey = `geocode_${normalizedLat}_${normalizedLng}_${language}`;
    
    // Check cache first for fast response
    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    // Check for water location first to avoid unnecessary API calls
    const isWater = isWaterLocation(normalizedLat, normalizedLng);
    
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
      longitude: normalizedLng,
      isWater // Add water flag
    };
    
    // Only make API call if not a water location
    if (!isWater) {
      try {
        const geocodingResult = await fetchLocationDetails(normalizedLat, normalizedLng, language);
        
        if (geocodingResult) {
          // Update our result with the enhanced data
          result.streetName = geocodingResult.streetName;
          result.townName = geocodingResult.townName || result.townName;
          result.cityName = geocodingResult.cityName || result.cityName;
          result.countyName = geocodingResult.countyName || result.countyName;
          result.stateName = geocodingResult.stateName;
          result.countryName = geocodingResult.countryName;
          result.postalCode = geocodingResult.postalCode;
          
          // Generate a better formatted name with the detailed components
          if (geocodingResult.formattedName) {
            result.formattedName = geocodingResult.formattedName;
          }
        }
      } catch (error) {
        console.warn("Error enhancing location with Nominatim API:", error);
        // Continue with what we have from our database
      }
    } else {
      // Override name for water locations
      result.formattedName = language === 'en' ? 
        `Water location near ${result.formattedName}` : 
        `水域位置 靠近 ${result.formattedName}`;
    }
    
    // Cache the result
    addToCache(cacheKey, result);
    
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
      longitude,
      isWater: isWaterLocation(latitude, longitude)
    };
  }
}

/**
 * Additional utility to get street-level location information
 * with faster execution time
 */
export async function getStreetLevelLocation(
  latitude: number,
  longitude: number,
  language: Language = 'en'
): Promise<{
  streetName?: string;
  fullAddress: string;
  isWater: boolean;
}> {
  // Get the enhanced location details
  const details = await getEnhancedLocationDetails(latitude, longitude, language);
  
  // Return a structured response focusing on street-level details
  return {
    streetName: details.streetName,
    fullAddress: details.formattedName,
    isWater: details.isWater || false
  };
}
