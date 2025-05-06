
import { Language } from './types';
import { EnhancedLocationDetails, GeocodingResult } from './types/enhancedLocationTypes';
import { fetchLocationDetails } from './providers/nominatimGeocodingProvider';
import { GeocodeCache, addToCache, getFromCache } from './cache/geocodingCache';
import { normalizeCoordinates } from './utils/coordinateUtils';
import { findNearestTown } from '@/utils/nearestTownCalculator';
import { isWaterLocation } from '@/utils/locationWaterCheck';
import { formatAddressComponents } from './formatters/addressFormatter';
import { formatDistance } from '@/utils/location/formatDistance';

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
      return {
        ...cachedResult,
        isWater: isWaterLocation(normalizedLat, normalizedLng, false) // Less strict check from cache
      };
    }
    
    // First attempt to get location details via API before determining if it's water
    // This ensures we have the best chance to identify land locations correctly
    let geocodingResult = null;
    try {
      geocodingResult = await fetchLocationDetails(normalizedLat, normalizedLng, language);
    } catch (error) {
      console.warn("Error fetching location details from Nominatim API:", error);
      // Continue with local detection if API fails
    }
    
    // Get nearest town info for additional context regardless of API results
    const nearestTownInfo = findNearestTown(normalizedLat, normalizedLng, language);
    
    // Build a detailed formatted name that includes street level information when available
    let detailedName = "";
    let isWater = false;
    
    if (geocodingResult) {
      // Construct a detailed location name from the geocoding result
      const nameParts = [];
      
      // Start with the most specific information
      if (geocodingResult.streetName) {
        nameParts.push(geocodingResult.streetName);
      }
      
      if (geocodingResult.townName || geocodingResult.cityName) {
        nameParts.push(geocodingResult.townName || geocodingResult.cityName);
      } else if (nearestTownInfo.townName) {
        nameParts.push(nearestTownInfo.townName);
      }
      
      if (geocodingResult.countyName && 
          (!geocodingResult.townName || geocodingResult.countyName !== geocodingResult.townName)) {
        nameParts.push(geocodingResult.countyName);
      }
      
      if (geocodingResult.stateName && 
          (!geocodingResult.countyName || geocodingResult.stateName !== geocodingResult.countyName)) {
        nameParts.push(geocodingResult.stateName);
      }
      
      // Use the constructed name if we have parts, otherwise use the API formatted name
      if (nameParts.length > 0) {
        detailedName = nameParts.join(language === 'en' ? ', ' : '，');
      } else if (geocodingResult.formattedName) {
        detailedName = geocodingResult.formattedName;
      }
      
      // If we have street name, town name, or city name, it's unlikely to be water
      if (geocodingResult.streetName || geocodingResult.townName || geocodingResult.cityName) {
        isWater = false;
      } else {
        // Check if location is water
        isWater = isWaterLocation(normalizedLat, normalizedLng, true);
      }
    } else {
      // If no geocoding result, use nearest town info and check if it's water
      isWater = isWaterLocation(normalizedLat, normalizedLng, true);
      detailedName = nearestTownInfo.detailedName || "";
    }
    
    // For water locations, create specific formatting
    if (isWater) {
      const nearestLocation = nearestTownInfo.townName || 
                             (language === 'en' ? 'shore' : '海岸');
      
      detailedName = language === 'en' 
        ? `Water near ${nearestLocation}` 
        : `水域靠近${nearestLocation}`;
    }
    
    // Build the final result object with all available information
    const result: EnhancedLocationDetails = {
      name: detailedName || (language === 'en' ? 'Unknown location' : '未知位置'),
      formattedName: detailedName || (language === 'en' ? 'Unknown location' : '未知位置'),
      chineseName: language === 'zh' ? detailedName : undefined,
      townName: geocodingResult?.townName || nearestTownInfo.townName,
      cityName: geocodingResult?.cityName || nearestTownInfo.city,
      countyName: geocodingResult?.countyName || nearestTownInfo.county,
      streetName: geocodingResult?.streetName,
      stateName: geocodingResult?.stateName,
      countryName: geocodingResult?.countryName || "Unknown",
      postalCode: geocodingResult?.postalCode,
      distance: nearestTownInfo.distance,
      formattedDistance: formatDistance(nearestTownInfo.distance, language),
      detailedName: detailedName,
      latitude: normalizedLat,
      longitude: normalizedLng,
      isWater: isWater,
      // Required by the interface
      address: detailedName || (language === 'en' ? 'Unknown location' : '未知位置'),
      country: geocodingResult?.countryName || "Unknown",
      countryCode: geocodingResult?.countryCode || "Unknown",
      region: geocodingResult?.stateName || "Unknown",
      formattedAddress: detailedName || (language === 'en' ? 'Unknown location' : '未知位置'),
      timezone: geocodingResult?.timezone || "Unknown"
    };
    
    // Cache the result
    addToCache(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return {
      name: language === 'en' ? 
        `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : 
        `位置 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      formattedName: language === 'en' ? 
        `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : 
        `位置 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      chineseName: `位置 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, // Include Chinese name for error case
      latitude,
      longitude,
      isWater: false, // Default to not water when error occurs
      // Required by the new interface
      address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      country: "Unknown",
      countryCode: "Unknown",
      region: "Unknown",
      formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      timezone: "Unknown"
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
    fullAddress: details.formattedName || details.formattedAddress,
    isWater: details.isWater || false
  };
}
