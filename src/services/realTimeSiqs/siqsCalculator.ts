
import { hasCachedSiqs, getCachedSiqs, setSiqsCache } from './siqsCache';
import { fetchWeatherData, fetchForecastData } from '@/lib/api';
import { getLocationKey } from './cacheConfig';
import { extractSingleHourCloudCover } from '@/utils/weather/hourlyCloudCoverExtractor';
import { SiqsResult, SiqsCalculationOptions, WeatherDataWithClearSky } from './siqsTypes';

/**
 * Calculate real-time SIQS (Stellar Imaging Quality Score) for a specific location
 */
export async function calculateRealTimeSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number = 5,
  options: SiqsCalculationOptions = {}
): Promise<SiqsResult> {
  // Default options
  const {
    useSingleHourSampling = true,
    targetHour = 1, // 1 AM as default for best viewing
    cacheDurationMins = 15,
    includeMetadata = true
  } = options;

  try {
    // Validate input
    if (!isFinite(latitude) || !isFinite(longitude) || !isFinite(bortleScale)) {
      console.error("Invalid coordinates or Bortle scale:", { latitude, longitude, bortleScale });
      return { siqs: 0, isViable: false };
    }
    
    // Normalize Bortle scale to ensure it's in the correct range (1-9)
    const normalizedBortleScale = Math.min(Math.max(bortleScale, 1), 9);
    
    // Check cache first
    if (hasCachedSiqs(latitude, longitude)) {
      const cachedResult = getCachedSiqs(latitude, longitude);
      if (cachedResult) {
        console.log("Using cached SIQS result for", getLocationKey(latitude, longitude));
        return cachedResult;
      }
    }
    
    // Fetch current weather data
    const weatherPromise = fetchWeatherData({ latitude, longitude });
    
    // Fetch forecast data in parallel
    const forecastPromise = useSingleHourSampling ? 
      fetchForecastData({ latitude, longitude, days: 3 }) : 
      Promise.resolve(null);
    
    // Wait for both to complete
    const [weatherData, forecastData] = await Promise.all([
      weatherPromise, 
      forecastPromise
    ]);
    
    if (!weatherData) {
      console.error("Failed to fetch weather data for SIQS calculation");
      return { siqs: 0, isViable: false };
    }

    // Extract factors from weather data
    const cloudCover = weatherData.cloudCover || 0;
    const humidity = weatherData.humidity || 0;
    const windSpeed = weatherData.windSpeed || 0;
    const temperature = weatherData.temperature || 15; // Default to 15°C if missing
    const precipitation = weatherData.precipitation || 0;
    const clearSkyRate = (weatherData as WeatherDataWithClearSky).clearSkyRate || null; // Cast to access optional property
    
    let effectiveCloudCover = cloudCover;
    let targetHourData: { hour: number; cloudCover: number } | null = null;
    
    // If we have forecast data and single hour sampling is enabled, extract cloud cover for the target hour
    if (forecastData && forecastData.hourly && useSingleHourSampling) {
      const targetHourCloudCover = extractSingleHourCloudCover(forecastData, targetHour);
      
      if (targetHourCloudCover !== null) {
        console.log(`Using ${targetHour}AM cloud cover for SIQS calculation: ${targetHourCloudCover.toFixed(1)}%`);
        effectiveCloudCover = targetHourCloudCover;
        targetHourData = { hour: targetHour, cloudCover: targetHourCloudCover };
      }
    }
    
    // Calculate SIQS from weather factors
    const bortleEffect = 10 - normalizedBortleScale;
    const cloudEffect = 10 - (effectiveCloudCover / 10);
    const humidityEffect = 10 - (humidity / 10);
    const windEffect = Math.max(0, 10 - (windSpeed / 3));
    const temperatureEffect = 10 - Math.abs(temperature - 15) / 3;
    
    // Use clear sky rate if available for better accuracy
    const clearSkyEffect = clearSkyRate !== null ? clearSkyRate / 10 : 5;
    
    // Apply precipitation penalty (0 if precipitation, otherwise 10)
    const precipitationEffect = precipitation > 0 ? 0 : 10;
    
    // Calculate weighted average
    const rawScore = (
      (bortleEffect * 3) +  // Bortle scale is most important
      (cloudEffect * 3) +   // Cloud cover is equally important
      (humidityEffect * 1) +
      (windEffect * 1) +
      (temperatureEffect * 0.5) +
      (clearSkyEffect * 1.5) +
      (precipitationEffect * 2)
    ) / 12; // Total weights = 12
    
    // Normalize to 0-10 range with 1 decimal precision
    const siqsScore = Math.max(0, Math.min(10, Math.round(rawScore * 10) / 10));
    
    // Determine viability based on score and critical factors
    const isViable = siqsScore >= 3.0 && 
                    effectiveCloudCover < 70 && 
                    precipitation === 0;
    
    // Prepare factors list for UI display
    const factors = [
      { name: 'Bortle Scale', score: bortleEffect, description: `Bortle Scale: ${normalizedBortleScale}` },
      { name: 'Cloud Cover', score: cloudEffect, description: `Cloud Cover: ${effectiveCloudCover.toFixed(0)}%` },
      { name: 'Humidity', score: humidityEffect, description: `Humidity: ${humidity.toFixed(0)}%` },
      { name: 'Wind Speed', score: windEffect, description: `Wind Speed: ${windSpeed.toFixed(1)} km/h` },
      { name: 'Temperature', score: temperatureEffect, description: `Temperature: ${temperature.toFixed(1)}°C` }
    ];
    
    // Add precipitation factor if present
    if (precipitation > 0) {
      factors.push({ name: 'Precipitation', score: precipitationEffect, description: `Precipitation: ${precipitation.toFixed(1)} mm` });
    }
    
    // Add clear sky rate if available
    if (clearSkyRate !== null) {
      factors.push({ name: 'Clear Sky Rate', score: clearSkyEffect, description: `Clear Sky Rate: ${clearSkyRate.toFixed(0)}%` });
    }
    
    // Add target hour data if available
    if (targetHourData) {
      factors.forEach(factor => {
        if (factor.name === 'Cloud Cover') {
          factor.description = `${factor.name}: ${effectiveCloudCover.toFixed(0)}% at ${targetHourData!.hour}AM`;
        }
      });
    }
    
    // Build result object with metadata
    const result: SiqsResult = {
      siqs: siqsScore,
      isViable,
      factors,
      weatherData: {
        ...weatherData,
        latitude,
        longitude
      } as WeatherDataWithClearSky,
      forecastData: forecastData || undefined
    };
    
    // Add metadata if requested
    if (includeMetadata) {
      result.metadata = {
        calculatedAt: new Date().toISOString(),
        sources: {
          weather: true,
          forecast: !!forecastData,
          clearSky: clearSkyRate !== null,
          lightPollution: true
        }
      };
      
      // Add targetHour to metadata if available
      if (useSingleHourSampling && targetHourData) {
        result.metadata.targetHour = targetHourData.hour;
      }
    }
    
    // Cache the result
    setSiqsCache(latitude, longitude, result);
    
    return result;
  } catch (error) {
    console.error("Error calculating real-time SIQS:", error);
    return { siqs: 0, isViable: false };
  }
}
