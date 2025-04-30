
/**
 * Forecast integration with map applications
 * Makes it easier to generate spot data for maps
 */
 
import { ForecastDayAstroData, BatchLocationData, ExtendedSiqsResult } from "../types/forecastTypes";
import { enhancedForecastProcessor } from "../processors/forecastProcessor";
import { forecastCache } from "../utils/forecastCache";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { getLocationTimeInfo } from "@/utils/timezone/timeZoneCalculator";

/**
 * Create a spot from forecast data - useful for generating map locations
 */
export function createSpotFromForecastData(
  latitude: number,
  longitude: number,
  forecastData: ForecastDayAstroData,
  distance: number,
  name?: string
): SharedAstroSpot {
  const timeInfo = getLocationTimeInfo(latitude, longitude);
  // Use our extended type or a default value to ensure type safety
  const siqsResult = forecastData.siqsResult as ExtendedSiqsResult;
  const bortleScale = siqsResult?.bortleScale || 4;
  
  return {
    id: `forecast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: name || 'Forecast Location',
    latitude,
    longitude,
    bortleScale,
    siqs: (forecastData.siqs || 0) * 10,
    isViable: forecastData.isViable,
    distance,
    timestamp: new Date().toISOString(),
    timeInfo: {
      isNighttime: timeInfo.isNighttime,
      timeUntilNight: timeInfo.timeUntilNight,
      timeUntilDaylight: timeInfo.timeUntilDaylight
    }
  };
}

/**
 * Enhanced map data provider optimized for interactive map applications
 */
export const forecastMapService = {
  /**
   * Get forecast quality grid for map visualization
   * Returns a grid of points with forecast quality for heatmap display
   */
  getQualityHeatmapData: async (
    centerLat: number,
    centerLng: number,
    radiusKm: number,
    gridDensity: number = 5,
    dayIndex: number = 0
  ): Promise<Array<{ 
    latitude: number; 
    longitude: number; 
    quality: number; 
    isViable: boolean 
  }>> => {
    // Generate cache key for this request
    const cacheKey = `heatmap-${centerLat.toFixed(4)}-${centerLng.toFixed(4)}-${radiusKm}-${gridDensity}-${dayIndex}`;
    
    // Check cache first
    const cachedData = forecastCache.getCachedForecast(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Get forecast data for the area
    const areaForecast = await enhancedForecastProcessor.getForecastForArea(
      centerLat,
      centerLng,
      radiusKm,
      gridDensity,
      dayIndex
    );
    
    // Transform to heatmap data format
    const heatmapData = areaForecast.map(point => ({
      latitude: point.latitude,
      longitude: point.longitude,
      quality: point.forecast?.siqs || 0,
      isViable: point.forecast?.isViable || false
    }));
    
    // Cache the result for future requests
    forecastCache.setCachedForecast(cacheKey, heatmapData);
    
    return heatmapData;
  },
  
  /**
   * Generate potential spots from forecast data
   * Useful for suggesting possible astronomy locations on a map
   */
  generatePotentialSpots: async (
    centerLat: number,
    centerLng: number,
    radiusKm: number,
    minQuality: number = 5,
    limit: number = 5,
    dayIndex: number = 0
  ): Promise<SharedAstroSpot[]> => {
    // Get quality heatmap with higher density for better spot selection
    const heatmapData = await forecastMapService.getQualityHeatmapData(
      centerLat,
      centerLng,
      radiusKm,
      Math.min(8, Math.ceil(Math.sqrt(limit) * 2)),
      dayIndex
    );
    
    // Filter by quality and sort
    const qualityPoints = heatmapData
      .filter(point => point.quality >= minQuality)
      .sort((a, b) => b.quality - a.quality);
      
    // Take top points, ensuring they're not too close to each other
    const selectedPoints: typeof qualityPoints = [];
    const minDistanceBetweenPoints = radiusKm / Math.sqrt(limit) / 2;
    
    for (const point of qualityPoints) {
      // Skip if we've reached the limit
      if (selectedPoints.length >= limit) break;
      
      // Check if this point is far enough from already selected points
      const isFarEnough = selectedPoints.every(selectedPoint => {
        const distance = calculateDistance(
          point.latitude, 
          point.longitude, 
          selectedPoint.latitude, 
          selectedPoint.longitude
        );
        return distance > minDistanceBetweenPoints;
      });
      
      if (isFarEnough) {
        selectedPoints.push(point);
      }
    }
    
    // Convert to SharedAstroSpot format with complete forecast data
    const spotPromises = selectedPoints.map(async point => {
      // Calculate distance from center
      const distance = calculateDistance(
        centerLat, 
        centerLng, 
        point.latitude, 
        point.longitude
      );
      
      // Get detailed forecast for this point
      const forecastData = await enhancedForecastProcessor.getForecastForArea(
        point.latitude,
        point.longitude,
        0.1, // Very small radius to get just this point
        1,   // Just one point
        dayIndex
      );
      
      if (forecastData.length > 0 && forecastData[0].forecast) {
        return createSpotFromForecastData(
          point.latitude,
          point.longitude,
          forecastData[0].forecast,
          distance,
          `Quality Point (${point.quality.toFixed(1)})`
        );
      }
      
      // Fallback if detailed forecast fails
      return {
        id: `spot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `Quality Point (${point.quality.toFixed(1)})`,
        latitude: point.latitude,
        longitude: point.longitude,
        bortleScale: 4, // Default
        siqs: point.quality * 10,
        isViable: point.isViable,
        distance,
        timestamp: new Date().toISOString(),
        timeInfo: {
          isNighttime: false,
          timeUntilNight: 0,
          timeUntilDaylight: 0
        }
      };
    });
    
    return Promise.all(spotPromises);
  }
};

/**
 * Calculate distance between two points in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

/**
 * Convert degrees to radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
