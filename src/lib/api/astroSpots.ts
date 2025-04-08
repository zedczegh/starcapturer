
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
}

/**
 * Check if a location is likely in a coastal water area
 * This is a compatibility method that delegates to the locationValidator utility
 */
export const isLikelyCoastalWater = (latitude: number, longitude: number): boolean => {
  return isWaterLocation(latitude, longitude);
};
