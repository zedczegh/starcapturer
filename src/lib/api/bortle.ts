
import { isInChina, getCityBortleScale } from '@/utils/chinaBortleData';

/**
 * Fetch Bortle scale data for a given location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Promise resolving to a Bortle scale value (1-9)
 */
export const fetchBortleData = async (latitude: number, longitude: number): Promise<number> => {
  try {
    // Check if we have Bortle data for mainland China
    const bortleFromChina = getBortleFromChinaData(latitude, longitude);
    if (bortleFromChina) {
      return bortleFromChina;
    }
    
    // Fallback to an estimate based on geography
    // Cities tend to have higher light pollution
    return estimateBortleScale(latitude, longitude);
  } catch (error) {
    console.error("Error fetching Bortle data:", error);
    return 5; // Default fallback
  }
};

/**
 * Get Bortle scale value from China-specific dataset
 */
function getBortleFromChinaData(latitude: number, longitude: number): number | null {
  // Check if the coordinates are within China's approximate bounds
  if (
    latitude >= 18 && latitude <= 53 &&
    longitude >= 73 && longitude <= 135
  ) {
    return getCityBortleScale(latitude, longitude);
  }
  return null;
}

/**
 * Estimate Bortle scale based on geographic factors
 * This is a fallback when no direct data is available
 */
function estimateBortleScale(latitude: number, longitude: number): number {
  // This is a simplified estimation based on latitude
  // Could be improved with actual light pollution data
  
  // Try to identify large cities or populated areas
  // Higher latitudes generally have fewer people (less light pollution)
  const latitudeAdjustment = Math.max(0, 4 - Math.abs(latitude) / 15);
  
  // This would ideally integrate with a population density database
  // For now, we're using a simplified approach
  return Math.min(9, Math.max(1, Math.round(4 + latitudeAdjustment)));
}
