import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { isWaterLocation as checkWaterLocation } from "@/utils/locationWaterCheck";

/**
 * Check if coordinates represent a water location
 * This is a critical function for filtering out unusable spots
 * Now with enhanced water detection including coastlines and large water bodies
 */
export const isWaterLocation = (
  latitude: number, 
  longitude: number,
  isCertified: boolean = false
): boolean => {
  // CRITICAL: If it's a certified location, NEVER consider it a water location
  // This ensures certified locations are always displayed regardless of location
  if (isCertified) return false;
  
  // First check: Basic water detection
  if (checkWaterLocation(latitude, longitude, false)) {
    return true;
  }
  
  // Second check: Coastline detection
  if (isLikelyCoastalWater(latitude, longitude)) {
    return true;
  }
  
  return false;
};

/**
 * Enhanced water detection for coastal areas
 */
const isLikelyCoastalWater = (
  latitude: number,
  longitude: number
): boolean => {
  // Known coastal waters lookup table (compressed for better performance)
  const coastalZones = [
    // Major coastlines (lat1, lat2, lng1, lng2)
    [25, 50, -130, -115], // US West Coast
    [25, 45, -85, -75],   // US East Coast
    [35, 60, -10, 20],    // European Coast
    [30, 45, 115, 145],   // East Asian Coast
    [0, 25, 110, 125],    // Southeast Asian Waters
  ];
  
  // Check if point falls within any coastal zone
  for (const [minLat, maxLat, minLng, maxLng] of coastalZones) {
    if (latitude >= minLat && latitude <= maxLat && 
        longitude >= minLng && longitude <= maxLng) {
      return true;
    }
  }
  
  return false;
};

/**
 * Check if a location is likely to be coastal water
 * Enhanced detection for coastal areas with faster processing
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns boolean indicating if location is likely coastal water
 */
export const isLikelyCoastalWaterOld = (
  latitude: number,
  longitude: number
): boolean => {
  // Enhanced coastal waters detection
  // First, quickly check if it's a remote area before doing more intensive checks
  if (latitude < -60 || latitude > 75) {
    return false; // No need to check coastal areas in polar regions
  }
  
  // Lookup tables for faster performance rather than calculating distances
  const knownCoastalZones = [
    // US East Coast - compressed representation
    [25, 45, -80, -70],
    // European coastline
    [36, 60, -10, 20],
    // East Asian coastlines
    [20, 45, 110, 145]
  ];
  
  // First, do a quick check if we're in any of the coastal zones
  for (const [minLat, maxLat, minLng, maxLng] of knownCoastalZones) {
    if (latitude >= minLat && latitude <= maxLat && 
        longitude >= minLng && longitude <= maxLng) {
      
      // Now check specific coastal points - only if we're in the general area
      const knownCoastalPoints = getCoastalPointsForZone(latitude, longitude);
      
      if (knownCoastalPoints.length > 0) {
        for (const [pointLat, pointLng, radius] of knownCoastalPoints) {
          // Use squared distance for performance (avoid sqrt)
          const squaredDistance = Math.pow(latitude - pointLat, 2) + 
                                 Math.pow(longitude - pointLng, 2);
          
          if (squaredDistance < radius * radius) {
            return true;
          }
        }
      }
    }
  }
  
  return false;
};

/**
 * Helper function to get coastal points for a specific zone
 * This optimizes performance by only loading points relevant to the area
 */
function getCoastalPointsForZone(lat: number, lng: number): [number, number, number][] {
  // US East Coast
  if (lat > 25 && lat < 45 && lng > -80 && lng < -70) {
    return [
      [40.7, -74.0, 0.4], // NYC area
      [42.3, -71.0, 0.4], // Boston area
      [38.9, -77.0, 0.3], // DC area
      [25.8, -80.2, 0.5], // Miami area
      [39.2, -76.5, 0.3], // Baltimore
      [29.7, -95.4, 0.5], // Houston
      [32.8, -79.9, 0.3], // Charleston
      [33.8, -78.7, 0.3], // Myrtle Beach
    ];
  }
  
  // European coastline
  if (lat > 36 && lat < 60 && lng > -10 && lng < 20) {
    return [
      [51.5, -0.1, 0.3], // London
      [53.4, -3.0, 0.3], // Liverpool
      [43.3, -3.0, 0.3], // Northern Spain
      [41.4, 2.2, 0.3],  // Barcelona
      [43.7, 7.2, 0.2],  // Monaco/Nice
      [40.8, 14.2, 0.3], // Naples
      [37.9, 23.7, 0.3], // Athens
    ];
  }
  
  // East Asian coastlines
  if (lat > 20 && lat < 45 && lng > 110 && lng < 145) {
    return [
      [35.6, 139.8, 0.3], // Tokyo Bay
      [31.2, 121.5, 0.3], // Shanghai
      [22.3, 114.2, 0.3], // Hong Kong
      [37.6, 126.8, 0.2], // Seoul/Incheon
      [35.2, 129.0, 0.2], // Busan
    ];
  }
  
  return [];
}

/**
 * Check if a location is valid for astronomy viewing
 * Combines multiple checks to filter out unusable spots with better performance
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param locationName Optional location name for additional checks
 * @returns boolean indicating if location is valid for astronomy
 */
export const isValidAstronomyLocation = (
  latitude: number, 
  longitude: number,
  locationName?: string
): boolean => {
  // Must have valid coordinates - fast check first
  if (!isFinite(latitude) || !isFinite(longitude) ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return false;
  }
  
  // Check if it's a water location - passing false to ensure certified locations aren't filtered
  if (checkWaterLocation(latitude, longitude, false)) {
    return false;
  }
  
  // Check if it's likely coastal water
  if (isLikelyCoastalWater(latitude, longitude)) {
    return false;
  }
  
  // If location has a name that suggests water (optional check)
  if (locationName) {
    const lowerName = locationName.toLowerCase();
    // Use faster includes method and early returns
    const commonWaterTerms = ['ocean', 'sea', 'bay', 'gulf', 'lake'];
    
    for (const term of commonWaterTerms) {
      if (lowerName.includes(term)) return false;
    }
    
    // Only check less common terms if we pass the common ones
    const otherWaterTerms = [
      'strait', 'channel', 'sound', 'harbor', 'harbour', 'port', 
      'pier', 'marina', 'lagoon', 'reservoir', 'fjord', 
      'canal', 'pond', 'basin', 'cove', 'inlet', 'beach'
    ];
    
    for (const term of otherWaterTerms) {
      if (lowerName.includes(term)) return false;
    }
  }
  
  // All checks passed
  return true;
};

/**
 * Validate location coordinates are within valid ranges
 * @param location Location to validate
 * @returns boolean indicating if location is valid
 */
export const hasValidCoordinates = (location: SharedAstroSpot): boolean => {
  return Boolean(
    location && 
    typeof location.latitude === 'number' && 
    typeof location.longitude === 'number' &&
    isFinite(location.latitude) &&
    isFinite(location.longitude) &&
    Math.abs(location.latitude) <= 90 &&
    Math.abs(location.longitude) <= 180
  );
};

/**
 * Create a unique ID for a location
 * @param location Location to create ID for
 * @returns string ID
 */
export const getLocationId = (location: SharedAstroSpot): string => {
  return location.id || 
    `location-${location.latitude?.toFixed(6)}-${location.longitude?.toFixed(6)}`;
};

/**
 * Check if a location is a certified dark sky location
 * @param location Location to check
 * @returns boolean indicating if location is certified
 */
export const isCertifiedLocation = (location: SharedAstroSpot): boolean => {
  return location.isDarkSkyReserve === true || 
    (location.certification && location.certification !== '');
};
```

```typescript
import { Language } from './types';
import { EnhancedLocationDetails } from './types/enhancedLocationTypes';
import { fetchLocationDetails } from './providers/nominatimGeocodingProvider';
import { GeocodeCache, addToCache, getFromCache } from './cache/geocodingCache';
import { normalizeCoordinates } from './utils/coordinateUtils';
import { findNearestTown } from '@/utils/nearestTownCalculator';
import { isWaterLocation } from '@/utils/locationValidator';
import { formatAddressComponents } from './formatters/addressFormatter';

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
        isWater: isWaterLocation(normalizedLat, normalizedLng)
      };
    }
    
    // Check for water location first to avoid unnecessary API calls
    const isWater = isWaterLocation(normalizedLat, normalizedLng);
    
    // For water locations, return immediately with appropriate naming
    if (isWater) {
      const waterLocation = {
        name: language === 'en' ? 'Water Location' : '水域位置',
        formattedName: language === 'en' ? 'Water Location' : '水域位置',
        latitude: normalizedLat,
        longitude: normalizedLng,
        isWater: true
      };
      addToCache(cacheKey, waterLocation);
      return waterLocation;
    }
    
    // Get nearest town info for non-water locations
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
```

```typescript
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs } from '../realTimeSiqs/siqsCalculator';
import { getTerrainCorrectedBortleScale } from '@/utils/terrainCorrection';
import { isWaterLocation } from '@/utils/locationValidator';
import { getEnhancedLocationDetails } from '../geocoding/enhancedReverseGeocoding';

export const createSpotFromPoint = async (
  point: { latitude: number; longitude: number; distance: number },
  minQuality: number = 5
): Promise<SharedAstroSpot | null> => {
  try {
    // First check: reject water locations immediately
    if (isWaterLocation(point.latitude, point.longitude)) {
      console.log(`Rejected water location at ${point.latitude}, ${point.longitude}`);
      return null;
    }
    
    // Double check with enhanced geocoding
    const locationDetails = await getEnhancedLocationDetails(
      point.latitude,
      point.longitude
    );
    
    if (locationDetails.isWater) {
      console.log(`Rejected water location (geocoding) at ${point.latitude}, ${point.longitude}`);
      return null;
    }
    
    // Get terrain-corrected Bortle scale
    const correctedBortleScale = await getTerrainCorrectedBortleScale(
      point.latitude, 
      point.longitude
    ) || 4;
    
    // Calculate SIQS with improved parameters
    const siqsResult = await calculateRealTimeSiqs(
      point.latitude,
      point.longitude,
      correctedBortleScale
    );
    
    // Filter by quality threshold
    if (siqsResult && siqsResult.siqs >= minQuality) {
      return {
        id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: 'Calculated Location',
        latitude: point.latitude,
        longitude: point.longitude,
        bortleScale: correctedBortleScale,
        siqs: siqsResult.siqs * 10,
        isViable: siqsResult.isViable,
        distance: point.distance,
        timestamp: new Date().toISOString()
      };
    }
  } catch (err) {
    console.warn("Error processing spot:", err);
    return null;
  }
};
