
import { useCallback } from 'react';
import { calculateSIQSWithWeatherData } from './siqsCalculationUtils';
import { logSiqsCalculation } from '@/services/siqs/siqsLogger';

export const useSiqsCalculator = () => {
  const calculateSiqs = useCallback(async (
    weatherData: any,
    forecastData: any,
    latitude: number,
    longitude: number,
    locationName: string,
    language: string
  ) => {
    if (!weatherData) return null;
    
    let astroNightCloudCover: number | null = null;

    if (weatherData?.nighttimeCloudData?.average !== undefined) {
      astroNightCloudCover = weatherData.nighttimeCloudData.average;
    } else if (forecastData?.astro_night_cloud_cover !== undefined) {
      astroNightCloudCover = forecastData.astro_night_cloud_cover;
    } else if (weatherData?.cloudCover !== undefined) {
      astroNightCloudCover = weatherData.cloudCover;
    }

    // Log calculation event
    logSiqsCalculation({
      latitude,
      longitude,
      locationName: locationName || "Unknown",
      siqsScore: weatherData.siqsScore,
      astroNightCloudCover,
      additionalMetadata: {
        language,
        source: "SIQSCalculator"
      }
    });

    return weatherData.siqsScore;
  }, []);

  return { calculateSiqs };
};
