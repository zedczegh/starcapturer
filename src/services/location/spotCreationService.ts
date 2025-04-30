
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs } from '../realTimeSiqs/siqsCalculator';
import { isWaterLocation } from '@/utils/validation';
import { getEnhancedLocationDetails } from '../geocoding/enhancedReverseGeocoding';
import { getLocationTimeInfo } from '@/utils/timezone/timeZoneCalculator';
import { SiqsCalculationOptions } from '../realTimeSiqs/siqsTypes';
import { WeatherDataService } from '../weatherDataService';

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
    
    // Get additional weather metrics for more accurate calculation
    const weatherMetrics = await WeatherDataService.getLocationWeatherMetrics(
      point.latitude, 
      point.longitude
    );
    
    // Enhanced bortle scale detection based on location
    const defaultBortleScale = 
      locationDetails.citySize === 'urban' ? 6 : 
      locationDetails.citySize === 'suburban' ? 5 : 4;
    
    // Enhanced calculation options with improved accuracy
    const options: SiqsCalculationOptions = {
      useSingleHourSampling: true,
      targetHour: 1, // Use 1 AM for optimal viewing conditions
      cacheDurationMins: 30,
      useForecasting: true, // Use forecasting for more accurate results
      forecastDay: 0 // Today's forecast
    };

    const siqsResult = await calculateRealTimeSiqs(
      point.latitude,
      point.longitude,
      defaultBortleScale,
      options
    );
    
    // Enhanced quality threshold check
    if (siqsResult && siqsResult.siqs >= minQuality) {
      const result: SharedAstroSpot = {
        id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: locationDetails.name || locationDetails.displayName || 'Calculated Location',
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

      // Only add weatherData if it exists
      if (weatherMetrics?.weather || siqsResult.weatherData) {
        result.weatherData = {
          ...(weatherMetrics?.weather || {}),
          ...(siqsResult.weatherData || {})
        };
      }

      // Add clearSkyRate if available
      if (weatherMetrics?.clearSky?.annualRate) {
        if (!result.weatherData) {
          result.weatherData = { cloudCover: 0 };
        }
        if (!result.weatherData.clearSky) {
          result.weatherData.clearSky = {};
        }
        result.weatherData.clearSky.annualRate = weatherMetrics.clearSky.annualRate;
        result.clearSkyRate = weatherMetrics.clearSky.annualRate;
      }

      return result;
    }
    
    return null;
  } catch (err) {
    console.error("Error processing spot:", err);
    return null;
  }
};
