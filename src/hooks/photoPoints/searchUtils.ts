import { toast } from "sonner";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { findLocationsWithinRadius, findCalculatedLocations } from "@/services/locationSearchService";
import { isValidAstronomyLocation } from "@/utils/locationValidator";
import { Language } from "@/contexts/LanguageContext";
import { isSiqsGreaterThan } from "@/utils/siqsHelpers";
import { calculateDistance } from '@/utils/geoUtils';
import { isWaterLocation } from '@/utils/locationValidator';

// Maximum calculated locations to request per batch
export const MAX_CALCULATED_LOCATIONS = 10;

/**
 * Search for locations within radius
 * @param latitude User latitude
 * @param longitude User longitude
 * @param searchDistance Search radius in km
 * @param language Current language
 * @returns Found locations
 */
export const searchStandardLocations = async (
  latitude: number,
  longitude: number,
  searchDistance: number,
  language: Language
): Promise<{ locations: SharedAstroSpot[], message: string | null }> => {
  try {
    // Find locations within radius
    const locations = await findLocationsWithinRadius(
      latitude,
      longitude,
      searchDistance
    );
    
    if (locations.length === 0) {
      return { 
        locations: [], 
        message: language === "en" 
          ? "No standard locations found in this area" 
          : "在此区域未找到标准位置" 
      };
    }
    
    // Filter out any invalid locations
    const validLocations = locations.filter(loc => {
      // First check if location is valid (not on water)
      if (!isValidAstronomyLocation(loc.latitude, loc.longitude, loc.name)) {
        console.log(`Filtered out ${loc.name} at ${loc.latitude}, ${loc.longitude} as invalid astronomy location`);
        return false;
      }
      
      // Then check SIQS
      return loc.siqs !== undefined && isSiqsGreaterThan(loc.siqs, 0);
    });
    
    return { locations: validLocations, message: null };
  } catch (error) {
    console.error("Error searching standard locations:", error);
    return { 
      locations: [], 
      message: language === "en" 
        ? "Error searching for locations" 
        : "搜索位置时出错" 
    };
  }
};

/**
 * Search for calculated locations when standard locations aren't found
 * @param latitude User latitude
 * @param longitude User longitude
 * @param searchDistance Search radius in km
 * @param language Current language
 * @param existingLocations Any existing locations to avoid duplicates
 * @returns Found calculated locations
 */
export const searchCalculatedLocations = async (
  latitude: number,
  longitude: number,
  searchDistance: number,
  language: Language,
  existingLocations: SharedAstroSpot[] = []
): Promise<{ locations: SharedAstroSpot[], message: string | null }> => {
  try {
    const calculatedLocations = await findCalculatedLocations(
      latitude,
      longitude,
      searchDistance,
      true, // Allow expanding the search radius
      MAX_CALCULATED_LOCATIONS // Limit to prevent API flooding
    );
    
    // Apply filtering to ensure valid locations
    const validLocations = calculatedLocations.filter(loc => {
      // Check for duplicates in existing locations
      const isDuplicate = existingLocations.some(existing => 
        existing.latitude === loc.latitude && 
        existing.longitude === loc.longitude
      );
      
      if (isDuplicate) {
        return false;
      }
      
      // Check if location is valid (not on water)
      if (!isValidAstronomyLocation(loc.latitude, loc.longitude, loc.name)) {
        console.log(`Filtered out ${loc.name} at ${loc.latitude}, ${loc.longitude} as invalid astronomy location`);
        return false;
      }
      
      // Then check SIQS
      return loc.siqs !== undefined && isSiqsGreaterThan(loc.siqs, 0);
    });
    
    if (validLocations.length === 0) {
      return { 
        locations: [], 
        message: language === "en" 
          ? "No suitable locations found in this area" 
          : "在此区域未找到适合的位置" 
      };
    }
    
    return { 
      locations: validLocations, 
      message: language === "en" 
        ? "Using calculated locations with good viewing conditions" 
        : "使用计算出的良好观测条件位置" 
    };
  } catch (error) {
    console.error("Error searching calculated locations:", error);
    return { 
      locations: [], 
      message: language === "en" 
        ? "Error searching for locations" 
        : "搜索位置时出错" 
    };
  }
};

/**
 * Show toast notification based on search results
 * @param message Toast message
 * @param isError Whether this is an error message
 * @param language Current language
 */
export const showSearchResultToast = (
  message: string | null, 
  isError: boolean = false,
  language: Language
) => {
  if (!message) return;
  
  if (isError) {
    toast.error(message, { 
      description: language === "en" 
        ? "Please try again later" 
        : "请稍后再试" 
    });
  } else {
    toast.info(message, { 
      description: language === "en" 
        ? "These are areas likely to have clear skies" 
        : "这些是可能有晴朗天空的区域" 
    });
  }
};

/**
 * Search utilities for photo points
 */
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { isWaterLocation, isValidAstronomyLocation } from '@/utils/locationValidator';
import { isSiqsGreaterThan } from '@/utils/siqsHelpers';

/**
 * Filter locations by SIQS score threshold
 */
export function filterLocationsBySiqsThreshold(
  locations: SharedAstroSpot[],
  threshold: number = 5
): SharedAstroSpot[] {
  if (!locations || !Array.isArray(locations)) return [];
  
  return locations.filter(loc => {
    // Always keep certified locations regardless of SIQS
    if (loc.isDarkSkyReserve || loc.certification) {
      return true;
    }
    
    return loc.siqs && isSiqsGreaterThan(loc.siqs, threshold);
  });
}

/**
 * Filter out water locations
 */
export function filterOutWaterLocations(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  if (!locations || !Array.isArray(locations)) return [];
  
  return locations.filter(loc => {
    // Always keep certified locations
    if (loc.isDarkSkyReserve || loc.certification) {
      return true;
    }
    
    return !isWaterLocation(loc.latitude, loc.longitude);
  });
}

/**
 * Sort locations by distance
 */
export function sortLocationsByDistance(
  locations: SharedAstroSpot[],
  userLat?: number,
  userLng?: number
): SharedAstroSpot[] {
  if (!locations || !Array.isArray(locations)) return [];
  if (!userLat || !userLng) return locations;
  
  return [...locations].sort((a, b) => {
    const distA = a.distance || calculateDistance(userLat, userLng, a.latitude, a.longitude);
    const distB = b.distance || calculateDistance(userLat, userLng, b.latitude, b.longitude);
    return distA - distB;
  });
}

/**
 * Check if a location is valid for astronomy
 */
export function isValidLocation(
  location: SharedAstroSpot
): boolean {
  // Always keep certified locations
  if (location.isDarkSkyReserve || location.certification) {
    return true;
  }
  
  return isValidAstronomyLocation(location.latitude, location.longitude, location.name);
}
