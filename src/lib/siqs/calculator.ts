
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getLightPollution } from '@/utils/lightPollutionData';
import { getWeatherData } from '@/lib/api/weather';

export const calculateSiqsForLocation = async (params: {
  latitude: number;
  longitude: number;
  elevation?: number;
  cloudCover?: number;
  lightPollution?: number;
}): Promise<number> => {
  const { latitude, longitude, elevation = 0, cloudCover = 0 } = params;
  
  try {
    // Get light pollution if not provided
    const lightPollution = params.lightPollution ?? await getLightPollution(latitude, longitude);
    
    // Basic SIQS calculation
    const baseScore = Math.max(0, 10 - (lightPollution * 0.5) - (cloudCover * 0.3));
    const elevationBonus = Math.min(2, elevation / 1000); // Up to 2 points for elevation
    
    return Math.min(10, Math.max(0, baseScore + elevationBonus));
  } catch (error) {
    console.error("Error calculating SIQS:", error);
    return 0;
  }
};
