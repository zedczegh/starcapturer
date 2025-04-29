
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { fetchForecastData, fetchLongRangeForecastData } from '@/lib/api';
import { generateDistributedPoints } from './location/pointGenerationService';
import { isWaterLocation } from '@/utils/validation';
import { createSpotFromPoint } from './location/spotCreationService';
import { getWeatherScoreForDay } from '@/utils/weatherPrediction';

// Extend SharedAstroSpot interface to include forecast properties
interface ForecastSpot extends SharedAstroSpot {
  forecastDay?: number;
  weatherScore?: number;
}

// Cache for forecast spot predictions to avoid redundant API calls
const forecastCache = new Map<string, {data: ForecastSpot[], timestamp: number}>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Generate quality spots based on weather forecast for a specific day
 */
export async function generateForecastQualitySpots(
  centerLat: number,
  centerLng: number, 
  radius: number,
  forecastDay: number = 0, // 0 = today, 1 = tomorrow, etc.
  limit: number = 10,
  minQuality: number = 5
): Promise<ForecastSpot[]> {
  try {
    // Check cache first
    const cacheKey = `forecast-spots-${centerLat.toFixed(4)}-${centerLng.toFixed(4)}-${radius}-${forecastDay}`;
    const cached = forecastCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      console.log(`Using cached forecast spots for day ${forecastDay}`);
      return cached.data;
    }
    
    console.log(`Generating ${limit} forecast-based spots within ${radius}km for day ${forecastDay}`);
    
    // Generate candidate points with good distribution
    const points = generateDistributedPoints(centerLat, centerLng, radius, limit * 3);
    
    // Fetch forecast data for the center location
    let forecastData;
    if (forecastDay <= 2) {
      // Use detailed hourly forecast for the first 3 days
      forecastData = await fetchForecastData({
        latitude: centerLat,
        longitude: centerLng,
        days: forecastDay + 1
      });
    } else {
      // Use daily forecast for days beyond 3
      forecastData = await fetchLongRangeForecastData({
        latitude: centerLat,
        longitude: centerLng,
        days: forecastDay + 1
      });
    }

    if (!forecastData) {
      console.error("Failed to fetch forecast data for spot generation");
      return [];
    }
    
    // Process points in batches
    const BATCH_SIZE = 5;
    const validSpots: ForecastSpot[] = [];
    
    // Create batches for parallel processing
    const batches = [];
    for (let i = 0; i < points.length; i += BATCH_SIZE) {
      batches.push(points.slice(i, i + BATCH_SIZE));
    }
    
    for (const batch of batches) {
      if (validSpots.length >= limit) break;
      
      // Process batch in parallel
      const batchPromises = batch.map(async point => {
        if (isWaterLocation(point.latitude, point.longitude)) {
          return null;
        }
        
        // Calculate weather score for this location on the selected day
        const weatherScore = getWeatherScoreForDay(forecastData, forecastDay);
        
        // Factor the weather score into the spot creation
        const spot = await createSpotFromPoint(point, minQuality) as ForecastSpot | null;
        
        // Add forecast day to the spot metadata
        if (spot) {
          spot.forecastDay = forecastDay;
          spot.weatherScore = weatherScore;
          
          // Add a prefix to the name to indicate it's a forecast spot
          const date = new Date();
          date.setDate(date.getDate() + forecastDay);
          const month = date.toLocaleString('default', { month: 'short' });
          const day = date.getDate();
          
          spot.name = spot.name 
            ? `${month} ${day}: ${spot.name}`
            : `Forecast spot for ${month} ${day}`;
        }
        
        return spot;
      });
      
      const batchResults = await Promise.all(batchPromises);
      const validBatchSpots = batchResults.filter(Boolean) as ForecastSpot[];
      validSpots.push(...validBatchSpots);
    }
    
    // Sort spots by combined quality score (SIQS and weather)
    const sortedSpots = validSpots.sort((a, b) => {
      const aScore = (a.siqs || 0) * (a.weatherScore || 1);
      const bScore = (b.siqs || 0) * (b.weatherScore || 1);
      return bScore - aScore;
    }).slice(0, limit);
    
    // Cache the results
    forecastCache.set(cacheKey, {
      data: sortedSpots,
      timestamp: Date.now()
    });
    
    return sortedSpots;
  } catch (error) {
    console.error("Error generating forecast quality spots:", error);
    return [];
  }
}

/**
 * Clear forecast spots cache
 */
export function clearForecastCache(
  centerLat?: number,
  centerLng?: number,
  radius?: number,
  forecastDay?: number
): void {
  try {
    if (centerLat !== undefined && centerLng !== undefined && 
        radius !== undefined && forecastDay !== undefined) {
      // Clear specific cache entry
      const cacheKey = `forecast-spots-${centerLat.toFixed(4)}-${centerLng.toFixed(4)}-${radius}-${forecastDay}`;
      forecastCache.delete(cacheKey);
      console.log(`Cleared specific forecast spots cache`);
    } else {
      // Clear all forecast cache
      forecastCache.clear();
      console.log(`Cleared all forecast spots cache entries`);
    }
  } catch (error) {
    console.error("Error clearing forecast cache:", error);
  }
}
