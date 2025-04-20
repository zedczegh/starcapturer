
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
    if (isWaterLocation(point.latitude, point.longitude)) {
      return null;
    }
    
    const locationDetails = await getEnhancedLocationDetails(
      point.latitude,
      point.longitude
    );
    
    if (locationDetails.isWater) {
      return null;
    }
    
    const timeInfo = getLocationTimeInfo(point.latitude, point.longitude);
    const defaultBortleScale = 4;
    
    const siqsResult = await calculateRealTimeSiqs(
      point.latitude,
      point.longitude,
      defaultBortleScale,
      {
        useSingleHourSampling: true,
        targetHour: 1, // Use 1 AM for optimal viewing conditions
        cacheDurationMins: 30
      }
    );
    
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
