
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs } from '../realTimeSiqs/siqsCalculator';
import { isWaterLocation } from '@/utils/validation';
import { getEnhancedLocationDetails } from '../geocoding/enhancedReverseGeocoding';
import { getLocationTimeInfo } from '@/utils/timezone/timeZoneCalculator';

export const createSpotFromPoint = async (
  point: { latitude: number; longitude: number; distance: number },
  minQuality: number = 5
): Promise<SharedAstroSpot | null> => {
  try {
    // First check: reject water locations immediately
    if (isWaterLocation(point.latitude, point.longitude)) {
      return null;
    }
    
    // Double check with enhanced geocoding
    const locationDetails = await getEnhancedLocationDetails(
      point.latitude,
      point.longitude
    );
    
    if (locationDetails.isWater) {
      return null;
    }
    
    // Get location time info
    const timeInfo = getLocationTimeInfo(point.latitude, point.longitude);
    
    // Calculate SIQS with default Bortle scale
    const defaultBortleScale = 4;
    
    // Calculate SIQS without waiting for Bortle data
    const siqsResult = await calculateRealTimeSiqs(
      point.latitude,
      point.longitude,
      defaultBortleScale
    );
    
    // Filter by quality threshold
    if (siqsResult && siqsResult.siqs >= minQuality) {
      return {
        id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: 'Calculated Location',
        latitude: point.latitude,
        longitude: point.longitude,
        bortleScale: defaultBortleScale,
        siqs: siqsResult.siqs * 10,
        isViable: siqsResult.isViable,
        distance: point.distance,
        timestamp: new Date().toISOString(),
        timeInfo: {
          isNighttime: timeInfo.isNighttime,
          timeUntilNight: timeInfo.timeUntilNight,
          timeUntilDaylight: timeInfo.timeUntilDaylight
        }
      };
    }
  } catch (err) {
    console.warn("Error processing spot:", err);
    return null;
  }
};
