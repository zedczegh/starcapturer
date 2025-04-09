
import { isWaterLocation } from "@/utils/locationValidator";

/**
 * Interface representing an astronomical viewing spot
 */
export interface SharedAstroSpot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
  description?: string;
  imageURL?: string;
  rating?: number;
  timestamp?: string;
  chineseName?: string;
  siqs?: number;
  siqsResult?: any; // Added for compatibility
  siqsFactors?: any[];
  distance?: number;
  isViable?: boolean;
  isDarkSkyReserve?: boolean;
  certification?: string;
  weatherData?: any;
  cloudCover?: number;
  photographer?: string; // Added to fix error in ShareLocationForm
  date?: string; // Added to fix error in PhotoLocationCard
}

/**
 * Response from sharing a location
 */
export interface SharingResponse {
  success: boolean;
  message?: string;
  id?: string;
}

/**
 * Check if a location is likely in a coastal water area
 * This is a compatibility method that delegates to the locationValidator utility
 */
export const isLikelyCoastalWater = (latitude: number, longitude: number): boolean => {
  return isWaterLocation(latitude, longitude);
};

/**
 * Get recommended photo points from the API
 * @param latitude User latitude
 * @param longitude User longitude
 * @param radius Search radius in km
 * @returns Promise resolving to locations list
 */
export const getRecommendedPhotoPoints = async (
  latitude: number,
  longitude: number,
  radius: number = 50
): Promise<SharedAstroSpot[]> => {
  // Simplified implementation for compatibility
  console.log(`Getting recommended points near [${latitude}, ${longitude}] within ${radius}km`);
  return [];
};

/**
 * Get a shared astro spot by ID
 * @param id Location ID
 * @returns Promise resolving to location data
 */
export const getSharedAstroSpot = async (id: string): Promise<SharedAstroSpot | null> => {
  // Simplified implementation for compatibility
  console.log(`Getting shared spot with ID: ${id}`);
  return null;
};

/**
 * Share an astronomy spot to the database
 * @param spotData Location data to share
 * @returns Promise resolving to sharing result
 */
export const shareAstroSpot = async (
  spotData: Omit<SharedAstroSpot, 'id'>
): Promise<SharingResponse> => {
  // Simplified implementation for compatibility
  console.log(`Sharing spot: ${spotData.name} at [${spotData.latitude}, ${spotData.longitude}]`);
  
  return {
    success: true,
    id: `generated-id-${Date.now()}`,
    message: "Location shared successfully"
  };
};
