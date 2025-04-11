
import { toast } from "sonner";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { findLocationsWithinRadius, findCalculatedLocations } from "@/services/locationSearchService";
import { isValidAstronomyLocation } from "@/utils/locationValidator";
import { Language } from "@/contexts/LanguageContext";

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
      if (!isValidAstronomyLocation(loc.latitude, loc.longitude)) {
        console.log(`Filtered out ${loc.name} at ${loc.latitude}, ${loc.longitude} as invalid astronomy location`);
        return false;
      }
      
      // Then check SIQS
      return loc.siqs !== undefined && loc.siqs > 0;
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
      searchDistance
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
      if (!isValidAstronomyLocation(loc.latitude, loc.longitude)) {
        console.log(`Filtered out ${loc.name} at ${loc.latitude}, ${loc.longitude} as invalid astronomy location`);
        return false;
      }
      
      // Then check SIQS
      return loc.siqs !== undefined && loc.siqs > 0;
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
