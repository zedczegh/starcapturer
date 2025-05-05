
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
    
    // Check cache first for fast response, but only if it's a full detailed result
    const cachedResult = getFromCache(cacheKey);
    if (cachedResult && 
        ((cachedResult.streetName && cachedResult.formattedName) || 
         (cachedResult.detailedName && cachedResult.detailedName.includes(',')))) {
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
    
    // Get nearest town info regardless of water status
    const nearestTownInfo = findNearestTown(normalizedLat, normalizedLng, language);
    
    // If we have detailed location data that indicates this is not water, trust it
    if (geocodingResult && 
        (geocodingResult.streetName || 
         geocodingResult.townName || 
         geocodingResult.cityName)) {
      // Strong evidence this is not a water location
      const isWater = false;
      
      // Create the most detailed formatted name possible
      let detailedFormattedName = "";
      const nameParts = [];
      
      // Always include the most specific location information first
      if (geocodingResult.streetName) {
        nameParts.push(geocodingResult.streetName);
      }
      
      if (geocodingResult.townName && 
          (!geocodingResult.streetName || !geocodingResult.streetName.includes(geocodingResult.townName))) {
        nameParts.push(geocodingResult.townName);
      }
      
      if (geocodingResult.cityName && 
          !nameParts.some(part => part.includes(geocodingResult.cityName))) {
        nameParts.push(geocodingResult.cityName);
      }
      
      if (geocodingResult.countyName && 
          !nameParts.some(part => part.includes(geocodingResult.countyName))) {
        nameParts.push(geocodingResult.countyName);
      }
      
      if (geocodingResult.stateName && 
          !nameParts.some(part => part.includes(geocodingResult.stateName))) {
        nameParts.push(geocodingResult.stateName);
      }
      
      if (geocodingResult.countryName && 
          !nameParts.some(part => part.includes(geocodingResult.countryName))) {
        nameParts.push(geocodingResult.countryName);
      }
      
      // Join parts with appropriate separator based on language
      detailedFormattedName = nameParts.join(language === 'en' ? ', ' : '，');
      
      // Fallback to geocoding result's formatted name if our construction is empty
      if (!detailedFormattedName && geocodingResult.formattedName) {
        detailedFormattedName = geocodingResult.formattedName;
      }
      
      // Further fallback to nearest town info if still empty
      if (!detailedFormattedName && nearestTownInfo.detailedName) {
        detailedFormattedName = nearestTownInfo.detailedName;
      }
      
      // Build our result with the API data and nearest town info
      const result: EnhancedLocationDetails = {
        name: geocodingResult.name || nearestTownInfo.townName || "Unknown",
        formattedName: detailedFormattedName || nearestTownInfo.detailedName || "Unknown",
        chineseName: language === 'zh' ? (geocodingResult.chineseName || nearestTownInfo.townName) : undefined,
        townName: geocodingResult.townName || nearestTownInfo.townName,
        cityName: geocodingResult.cityName || nearestTownInfo.city,
        countyName: geocodingResult.countyName || nearestTownInfo.county,
        streetName: geocodingResult.streetName,
        stateName: geocodingResult.stateName,
        countryName: geocodingResult.countryName || "Unknown",
        postalCode: geocodingResult.postalCode,
        distance: nearestTownInfo.distance,
        formattedDistance: formatDistance(nearestTownInfo.distance, language),
        detailedName: detailedFormattedName || nearestTownInfo.detailedName,
        latitude: normalizedLat,
        longitude: normalizedLng,
        isWater: isWater,
        // Required by the new interface
        address: detailedFormattedName || nearestTownInfo.detailedName || "Unknown",
        country: geocodingResult.countryName || "Unknown",
        countryCode: "Unknown",
        region: geocodingResult.stateName || "Unknown",
        formattedAddress: detailedFormattedName || nearestTownInfo.detailedName || "Unknown",
        timezone: "Unknown"
      };
      
      // Cache the result
      addToCache(cacheKey, result);
      return result;
    }
    
    // If API couldn't determine land status, use our local water detection
    // with more strict checking for better accuracy
    const isWater = isWaterLocation(normalizedLat, normalizedLng, true);
    
    // Start building our result with the nearest town info
    const result: EnhancedLocationDetails = {
      name: isWater ? 
        (language === 'en' ? 'Water Location' : '水域位置') : 
        nearestTownInfo.townName || "Unknown",
      formattedName: isWater ? 
        (language === 'en' ? `Water Location near ${nearestTownInfo.townName}` : `水域位置 靠近 ${nearestTownInfo.townName}`) : 
        (nearestTownInfo.detailedName || nearestTownInfo.townName || "Unknown"),
      chineseName: isWater ? 
        `水域位置 靠近 ${language === 'zh' ? nearestTownInfo.townName : ''}` : 
        (language === 'zh' ? nearestTownInfo.townName : undefined),
      townName: nearestTownInfo.townName,
      cityName: nearestTownInfo.city,
      countyName: nearestTownInfo.county,
      distance: nearestTownInfo.distance,
      formattedDistance: formatDistance(nearestTownInfo.distance, language),
      detailedName: nearestTownInfo.detailedName,
      latitude: normalizedLat,
      longitude: normalizedLng,
      isWater, // Add water flag
      // Required by the new interface
      address: nearestTownInfo.detailedName || "Unknown",
      country: "Unknown",
      countryCode: "Unknown",
      region: "Unknown",
      formattedAddress: nearestTownInfo.detailedName || "Unknown",
      timezone: "Unknown"
    };
    
    // If we got geocoding results but didn't have strong evidence of land,
    // enhance our result with any available data
    if (geocodingResult) {
      result.streetName = geocodingResult.streetName || result.streetName;
      result.townName = geocodingResult.townName || result.townName;
      result.cityName = geocodingResult.cityName || result.cityName;
      result.countyName = geocodingResult.countyName || result.countyName;
      result.stateName = geocodingResult.stateName;
      result.countryName = geocodingResult.countryName;
      result.postalCode = geocodingResult.postalCode;
      
      // Create the most detailed formatted name possible
      if (geocodingResult.streetName || 
          geocodingResult.townName || 
          geocodingResult.cityName ||
          geocodingResult.formattedName) {
        
        let detailedFormattedName = "";
        const nameParts = [];
        
        if (geocodingResult.streetName) {
          nameParts.push(geocodingResult.streetName);
        }
        
        if (geocodingResult.townName && 
            (!geocodingResult.streetName || !geocodingResult.streetName.includes(geocodingResult.townName))) {
          nameParts.push(geocodingResult.townName);
        }
        
        if (geocodingResult.cityName && 
            !nameParts.some(part => part.includes(geocodingResult.cityName))) {
          nameParts.push(geocodingResult.cityName);
        }
        
        if (geocodingResult.countyName && 
            !nameParts.some(part => part.includes(geocodingResult.countyName))) {
          nameParts.push(geocodingResult.countyName);
        }
        
        if (geocodingResult.stateName && 
            !nameParts.some(part => part.includes(geocodingResult.stateName))) {
          nameParts.push(geocodingResult.stateName);
        }
        
        if (geocodingResult.countryName && 
            !nameParts.some(part => part.includes(geocodingResult.countryName))) {
          nameParts.push(geocodingResult.countryName);
        }
        
        // Join parts with appropriate separator based on language
        detailedFormattedName = nameParts.join(language === 'en' ? ', ' : '，');
        
        // Fallback to geocoding result's formatted name if our construction is empty
        if (!detailedFormattedName && geocodingResult.formattedName) {
          detailedFormattedName = geocodingResult.formattedName;
        }
        
        if (detailedFormattedName) {
          // If we're marked as water but have a good formatted name, reconsider
          if (isWater && 
              !detailedFormattedName.includes("Water") && 
              !detailedFormattedName.includes("Ocean") && 
              !detailedFormattedName.includes("Sea")) {
            result.isWater = false; // Override water detection if we have a proper place name
          }
          
          result.formattedName = detailedFormattedName;
          result.detailedName = detailedFormattedName;
          result.formattedAddress = detailedFormattedName;
          result.address = detailedFormattedName;
        }
      }
      
      if (geocodingResult.chineseName) {
        result.chineseName = geocodingResult.chineseName;
      }
      
      if (geocodingResult.name) {
        result.name = geocodingResult.name;
      }
    }
    
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
