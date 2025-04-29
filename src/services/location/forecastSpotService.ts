
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { fetchLongRangeForecastData } from '@/lib/api';
import { calculateDistance } from '@/lib/api/coordinates';
import { getEffectiveCloudCover } from '@/lib/siqs/weatherDataUtils';
import { generateDistributedPoints } from './location/pointGenerationService';
import { isWaterLocation } from '@/utils/validation';

// Cache forecast data by location and day to reduce API calls
const forecastCache = new Map<string, {data: any, timestamp: number}>();
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

// Define types for forecast spots
interface ForecastWeatherSpot {
  latitude: number;
  longitude: number;
  date: string;
  cloudCover: number;
  temperature?: number;
  windSpeed?: number;
  humidity?: number;
  precipitation?: number;
  weatherCode?: number;
  weatherScore: number;
  distance?: number;
}

/**
 * Generate weather score based on forecast conditions
 */
export function generateWeatherScore(
  cloudCover: number, 
  windSpeed?: number, 
  humidity?: number, 
  precipitation?: number
): number {
  // Start with a perfect score and deduct for poor conditions
  let score = 10;
  
  // Cloud cover has the biggest impact (0-5 points)
  if (cloudCover >= 80) {
    score -= 5;
  } else if (cloudCover >= 60) {
    score -= 4;
  } else if (cloudCover >= 40) {
    score -= 3;
  } else if (cloudCover >= 20) {
    score -= 1.5;
  } else if (cloudCover >= 10) {
    score -= 0.5;
  }
  
  // Wind speed (0-3 points)
  if (windSpeed) {
    if (windSpeed >= 25) {
      score -= 3;
    } else if (windSpeed >= 15) {
      score -= 2;
    } else if (windSpeed >= 8) {
      score -= 1;
    }
  }
  
  // Humidity (0-1 points)
  if (humidity) {
    if (humidity >= 90) {
      score -= 1;
    } else if (humidity >= 75) {
      score -= 0.5;
    }
  }
  
  // Precipitation (0-3 points)
  if (precipitation) {
    if (precipitation >= 5) {
      score -= 3;
    } else if (precipitation >= 1) {
      score -= 2;
    } else if (precipitation > 0) {
      score -= 1;
    }
  }
  
  // Ensure score stays in range 0-10
  return Math.max(0, Math.min(10, score));
}

/**
 * Convert forecast weather spot to SharedAstroSpot format for display
 */
export function convertWeatherSpotToAstroSpot(
  weatherSpot: ForecastWeatherSpot, 
  userLocation: { latitude: number; longitude: number }
): SharedAstroSpot {
  // Calculate distance from user location
  const distance = calculateDistance(
    userLocation.latitude, 
    userLocation.longitude, 
    weatherSpot.latitude, 
    weatherSpot.longitude
  );
  
  // Generate unique ID based on coordinates and date
  const id = `forecast-${weatherSpot.latitude.toFixed(4)}-${weatherSpot.longitude.toFixed(4)}-${weatherSpot.date}`;
  
  // Map weather score to SIQS score (0-10 range)
  // SIQS score is primarily affected by cloud cover, wind speed, and other weather conditions
  const siqs = weatherSpot.weatherScore;
  
  const forecastDate = new Date(weatherSpot.date);
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(forecastDate);
  const formattedDate = forecastDate.toLocaleDateString();
  
  return {
    id,
    latitude: weatherSpot.latitude,
    longitude: weatherSpot.longitude,
    name: `Forecast: ${dayName}`,
    description: `Weather forecast for ${formattedDate} with SIQS ${siqs.toFixed(1)}/10`,
    siqs,
    distance,
    bortleScale: 4, // Default value
    isForecast: true,
    forecastDate: weatherSpot.date,
    timestamp: new Date().toISOString(),
    weatherData: {
      cloudCover: weatherSpot.cloudCover,
      temperature: weatherSpot.temperature || 0,
      windSpeed: weatherSpot.windSpeed || 0,
      humidity: weatherSpot.humidity || 0,
      precipitation: weatherSpot.precipitation || 0,
      time: weatherSpot.date,
      condition: '' // Will be populated later if needed
    }
  };
}

/**
 * Get forecast data for a specific location
 */
async function getForecastData(
  latitude: number, 
  longitude: number
): Promise<any> {
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  const cachedData = forecastCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp < CACHE_EXPIRY)) {
    return cachedData.data;
  }
  
  try {
    const forecastData = await fetchLongRangeForecastData({
      latitude,
      longitude
    });
    
    if (forecastData) {
      forecastCache.set(cacheKey, {
        data: forecastData,
        timestamp: Date.now()
      });
    }
    
    return forecastData;
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    return null;
  }
}

/**
 * Find locations with good forecast conditions for the specified day
 */
export async function findForecastLocations(
  userLocation: { latitude: number; longitude: number },
  options: { day: number; radius: number; maxPoints?: number }
): Promise<SharedAstroSpot[]> {
  const { day, radius, maxPoints = 10 } = options;
  
  if (!userLocation || day < 0 || day > 14) {
    return [];
  }
  
  try {
    // Generate grid of points within the specified radius
    const points = generateDistributedPoints(
      userLocation.latitude, 
      userLocation.longitude, 
      radius, 
      maxPoints * 3 // Generate more points than needed to filter for best weather
    );
    
    // Get forecast data for each point
    const forecastPromises = points.map(async (point) => {
      // Skip water locations
      if (isWaterLocation(point.latitude, point.longitude)) {
        return null;
      }
      
      const forecast = await getForecastData(point.latitude, point.longitude);
      
      if (!forecast || !forecast.daily) return null;
      
      // Get data for the specified forecast day
      const forecastDate = forecast.daily.time[day];
      if (!forecastDate) return null;
      
      // Get forecast values for the specific day
      const cloudCover = forecast.daily.cloud_cover_mean?.[day] || 50;
      const windSpeed = forecast.daily.wind_speed_10m_max?.[day] || 10;
      const humidity = forecast.daily.relative_humidity_2m_mean?.[day] || 60;
      const precipitation = forecast.daily.precipitation_sum?.[day] || 0;
      const weatherCode = forecast.daily.weather_code?.[day];
      const temperatureMax = forecast.daily.temperature_2m_max?.[day];
      
      // Calculate effective cloud cover (adjusted for precipitation)
      const effectiveCloudCover = getEffectiveCloudCover(cloudCover, precipitation);
      
      // Generate weather score based on forecast conditions
      const weatherScore = generateWeatherScore(
        effectiveCloudCover,
        windSpeed,
        humidity,
        precipitation
      );
      
      return {
        ...point,
        date: forecastDate,
        cloudCover: effectiveCloudCover,
        temperature: temperatureMax,
        windSpeed,
        humidity,
        precipitation,
        weatherCode,
        weatherScore
      };
    });
    
    const weatherResults = await Promise.all(forecastPromises);
    
    // Filter null results and ensure weatherScore is defined
    const validResults = weatherResults.filter((spot): spot is ForecastWeatherSpot => 
      spot !== null && spot.weatherScore !== undefined
    );
    
    // Sort by weather score (best first) and convert to AstroSpots
    const sortedSpots = validResults
      .sort((a, b) => b.weatherScore - a.weatherScore)
      .slice(0, maxPoints)
      .map(spot => convertWeatherSpotToAstroSpot(spot, userLocation));
    
    return sortedSpots;
  } catch (error) {
    console.error("Error finding forecast locations:", error);
    return [];
  }
}
