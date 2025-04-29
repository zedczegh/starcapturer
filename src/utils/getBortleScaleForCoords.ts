
import { getBortleScaleData } from "@/services/environmentalDataService/bortleScaleService";

/**
 * Get Bortle scale value for coordinates
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns Promise resolving to Bortle scale value (1-9)
 */
export const getBortleScaleForCoords = async (latitude: number, longitude: number): Promise<number> => {
  return getBortleScaleData(latitude, longitude);
};

export default getBortleScaleForCoords;
