
/**
 * Map integration for forecast services
 */
import { forecastCache } from '../utils/forecastCache';
import enhancedForecastAstroAdapter from '../enhancedForecastAstroAdapter';
import { ForecastDayAstroData } from '../types/forecastTypes';

interface ForecastMapPoint {
  latitude: number;
  longitude: number;
  quality: number;
  isViable: boolean;
}

export const forecastMapIntegration = {
  /**
   * Generate map points from forecast data
   * @param centerLat Center latitude
   * @param centerLng Center longitude
   * @param radiusKm Radius in kilometers 
   * @param forecastDay Day index (0 = today)
   * @param maxPoints Maximum number of points to generate
   * @returns Promise with array of map points
   */
  generateMapPoints: async (
    centerLat: number,
    centerLng: number,
    radiusKm: number = 50,
    forecastDay: number = 0,
    maxPoints: number = 10
  ): Promise<ForecastMapPoint[]> => {
    try {
      // Generate cache key
      const cacheKey = `map_points_${centerLat.toFixed(4)}_${centerLng.toFixed(4)}_${radiusKm}_${forecastDay}`;
      
      // Check cache
      const cachedPoints = forecastCache.getCachedForecast<ForecastMapPoint[]>(cacheKey);
      if (cachedPoints) {
        return cachedPoints;
      }
      
      // Generate grid of points within radius
      const pointCount = Math.min(maxPoints, 25);
      const points: ForecastMapPoint[] = [];
      
      for (let i = 0; i < pointCount; i++) {
        // Generate random points within radius
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.sqrt(Math.random()) * radiusKm;
        
        // Convert to lat/lng
        const lat = centerLat + (distance / 111) * Math.cos(angle);
        const lng = centerLng + (distance / (111 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);
        
        // Get forecast for this point
        const locationForecast = await enhancedForecastAstroAdapter.getForecastDay({
          latitude: lat,
          longitude: lng,
          forecastDay
        });
        
        if (locationForecast) {
          points.push({
            latitude: lat,
            longitude: lng,
            quality: locationForecast.siqs || 0,
            isViable: locationForecast.isViable
          });
        }
      }
      
      // Cache the results
      forecastCache.setCachedForecast(cacheKey, points);
      
      return points;
    } catch (error) {
      console.error('Error generating map points:', error);
      return [];
    }
  },
  
  /**
   * Get best forecast point within radius
   * @param centerLat Center latitude
   * @param centerLng Center longitude
   * @param radiusKm Radius in kilometers
   * @param forecastDay Day index (0 = today)
   * @returns Promise with best forecast point or null
   */
  getBestForecastPoint: async (
    centerLat: number,
    centerLng: number,
    radiusKm: number = 50,
    forecastDay: number = 0
  ): Promise<ForecastMapPoint | null> => {
    const points = await forecastMapIntegration.generateMapPoints(centerLat, centerLng, radiusKm, forecastDay);
    
    if (points.length === 0) return null;
    
    // Sort by quality (highest first)
    points.sort((a, b) => b.quality - a.quality);
    
    return points[0];
  }
};

export default forecastMapIntegration;
