
import { fetchLightPollutionData } from "@/lib/api";

/**
 * Fetches sky quality data for a location
 * Returns Bortle scale, SQM (Sky Quality Meter), and NELM (Naked Eye Limiting Magnitude) data
 */
export default async function getLocationSkyQuality(
  latitude: number,
  longitude: number
): Promise<{
  bortleScale: number | null;
  sqm: number | null;
  nelm: number | null;
}> {
  try {
    // Fetch light pollution data from API
    const pollutionData = await fetchLightPollutionData(latitude, longitude);
    
    // Extract Bortle scale from pollution data
    const bortleScale = pollutionData?.bortleScale ?? null;
    
    // Calculate SQM (Sky Quality Meter) value from Bortle scale if available
    // SQM formula based on approximate conversion from Bortle scale
    let sqm = null;
    if (bortleScale !== null) {
      // Convert Bortle scale (1-9) to SQM (22-17)
      // Higher Bortle = lower SQM (worse sky quality)
      sqm = 22 - ((bortleScale - 1) * (5/8));
    }
    
    // Calculate NELM (Naked Eye Limiting Magnitude) from SQM if available
    // NELM formula based on approximate conversion from SQM
    let nelm = null;
    if (sqm !== null) {
      // NELM is roughly proportional to SQM
      nelm = sqm - 8.5;
    }
    
    return {
      bortleScale,
      sqm,
      nelm
    };
  } catch (error) {
    console.error("Error getting sky quality data:", error);
    return {
      bortleScale: null,
      sqm: null,
      nelm: null
    };
  }
}
