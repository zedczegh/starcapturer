
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { fetchLongRangeForecastData } from '@/lib/api/forecast';
import { calculateDistance } from '@/utils/geoUtils';
import { generateRandomPoint } from './locationFilters';
import { isWaterLocation } from '@/utils/validation';

// Cache for forecast data to avoid repeated API calls
const forecastCache = new Map<string, any>();

/**
 * Generate forecast-based locations with predicted SIQS values
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param radius Search radius in km
 * @param forecastDay Day to forecast (1-15, where 1 is tomorrow)
 * @param limit Maximum number of spots to generate
 */
export async function generateForecastSpots(
  centerLat: number,
  centerLng: number,
  radius: number,
  forecastDay: number = 1,
  limit: number = 15
): Promise<SharedAstroSpot[]> {
  console.log(`Generating forecast spots for day ${forecastDay} within ${radius}km`);
  
  // Normalize forecast day to ensure it's within valid range (1-15)
  const normalizedDay = Math.min(Math.max(1, forecastDay), 15);
  
  // Generate random points within the radius
  const points: SharedAstroSpot[] = [];
  const attempts = Math.min(limit * 5, 100); // Limit attempts to avoid excessive processing
  
  for (let i = 0; i < attempts && points.length < limit; i++) {
    const point = generateRandomPoint(centerLat, centerLng, radius);
    
    // Skip water locations
    if (isWaterLocation(point.latitude, point.longitude)) {
      continue;
    }
    
    // Get forecast data for this point
    const forecastData = await getForecastData(point.latitude, point.longitude, normalizedDay);
    if (!forecastData) continue;
    
    const { cloudCover, precipitationProbability } = forecastData;
    
    // Calculate predicted SIQS based on cloud cover and precipitation
    // Higher cloud cover and precipitation probability = lower SIQS
    const cloudFactor = 1 - (cloudCover / 100);
    const precipFactor = 1 - (precipitationProbability / 100);
    const randomQualityFactor = 0.7 + (Math.random() * 0.3); // Random factor between 0.7 and 1.0
    
    // Calculate base SIQS (0-10 scale)
    let predictedSiqs = (cloudFactor * 0.7 + precipFactor * 0.3) * 10 * randomQualityFactor;
    
    // Adjust for distance - closer locations get a small boost
    const distanceFactorMax = 0.2; // Maximum 20% boost for closest locations
    const distanceFactor = 1 + (distanceFactorMax * (1 - (point.distance / radius)));
    predictedSiqs *= distanceFactor;
    
    // Ensure SIQS is within valid range
    predictedSiqs = Math.min(Math.max(predictedSiqs, 1), 10);
    
    // Create the forecast spot
    const forecastSpot: SharedAstroSpot = {
      id: `forecast-${Date.now()}-${i}-${point.latitude.toFixed(4)}-${point.longitude.toFixed(4)}`,
      name: `Forecast Spot ${i + 1}`,
      latitude: point.latitude,
      longitude: point.longitude,
      siqs: predictedSiqs,
      bortleScale: Math.max(1, Math.min(9, Math.floor(10 - predictedSiqs))),
      distance: point.distance,
      isForecast: true,
      forecastDay: normalizedDay,
      forecastData: {
        cloudCover,
        precipitationProbability,
        day: normalizedDay
      }
    };
    
    points.push(forecastSpot);
  }
  
  // Sort by predicted SIQS (highest first)
  return points.sort((a, b) => (b.siqs || 0) - (a.siqs || 0));
}

/**
 * Get forecast data for a specific location and day
 */
async function getForecastData(latitude: number, longitude: number, forecastDay: number): Promise<{ cloudCover: number, precipitationProbability: number } | null> {
  try {
    const cacheKey = `${latitude.toFixed(3)}-${longitude.toFixed(3)}`;
    
    // Check cache first
    if (forecastCache.has(cacheKey)) {
      const cachedData = forecastCache.get(cacheKey);
      return extractDailyForecast(cachedData, forecastDay);
    }
    
    // Fetch forecast data
    const forecastData = await fetchLongRangeForecastData({ latitude, longitude, days: 16 });
    
    if (!forecastData || !forecastData.daily) {
      return null;
    }
    
    // Cache the result
    forecastCache.set(cacheKey, forecastData);
    
    return extractDailyForecast(forecastData, forecastDay);
  } catch (error) {
    console.error("Error getting forecast data:", error);
    return null;
  }
}

/**
 * Extract daily forecast from full forecast data
 */
function extractDailyForecast(forecastData: any, forecastDay: number): { cloudCover: number, precipitationProbability: number } | null {
  if (!forecastData?.daily) return null;
  
  const { daily } = forecastData;
  const index = forecastDay; // Index 0 is today, 1 is tomorrow, etc.
  
  if (!daily.time || !daily.cloud_cover_mean || !daily.precipitation_probability_max || 
      index >= daily.time.length || index >= daily.cloud_cover_mean.length) {
    return null;
  }
  
  return {
    cloudCover: daily.cloud_cover_mean[index] || 50, // Default to 50% if missing
    precipitationProbability: daily.precipitation_probability_max[index] || 0
  };
}

/**
 * Clear forecast cache
 */
export function clearForecastCache(): void {
  forecastCache.clear();
}
