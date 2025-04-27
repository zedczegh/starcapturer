
import { getBortleScaleData } from "@/services/environmentalDataService/bortleScaleService";

/**
 * Get the Bortle scale for given coordinates
 */
export async function getBortleScaleForCoords(
  latitude: number,
  longitude: number,
  getCachedData: (key: string, maxAge?: number) => any,
  setCachedData: (key: string, data: any) => void,
): Promise<number> {
  try {
    // Using the getBortleScaleData from bortleScaleService
    return await getBortleScaleData(
      latitude,
      longitude,
      "", // No location name
      0,  // No user provided scale
      true, // Display only
      getCachedData,
      setCachedData
    );
  } catch (error) {
    console.error("Failed to get Bortle scale:", error);
    return 5; // Default to suburban sky
  }
}
