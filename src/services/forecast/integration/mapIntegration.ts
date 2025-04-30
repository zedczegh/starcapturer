
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { ForecastDayAstroData, ForecastMapPoint } from "../types/forecastTypes";
import { enhancedForecastAstroService } from "../enhancedForecastAstroService";

class ForecastMapService {
  // Generate map points from forecast data
  generateMapPoints(forecast: ForecastDayAstroData | ForecastDayAstroData[], location: {
    latitude: number;
    longitude: number;
    name?: string;
  }): ForecastMapPoint[] {
    const points: ForecastMapPoint[] = [];
    
    if (Array.isArray(forecast)) {
      // Handle array of forecast data
      forecast.forEach((f, index) => {
        points.push(this.createMapPoint(f, location, index));
      });
    } else {
      // Handle single forecast data
      points.push(this.createMapPoint(forecast, location, 0));
    }
    
    return points;
  }
  
  // Create a map point from forecast data
  private createMapPoint(
    forecast: ForecastDayAstroData, 
    location: { latitude: number; longitude: number; name?: string; },
    index: number
  ): ForecastMapPoint {
    return {
      id: `forecast-${location.latitude}-${location.longitude}-${index}`,
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name || `Forecast Point ${index + 1}`,
      siqs: forecast.siqs,
      cloudCover: forecast.cloudCover,
      forecastDay: forecast.dayIndex,
      forecastDate: forecast.date,
      isViable: forecast.isViable
    };
  }
  
  // Generate SharedAstroSpot from forecast points for map display
  convertToSharedAstroSpots(points: ForecastMapPoint[]): SharedAstroSpot[] {
    return points.map(point => ({
      id: point.id,
      name: point.name,
      latitude: point.latitude,
      longitude: point.longitude,
      siqs: point.siqs,
      isViable: point.isViable,
      bortleScale: 4, // Default value
      timestamp: new Date().toISOString(),
      isForecast: true,
      forecastDay: point.forecastDay,
      forecastDate: point.forecastDate,
      cloudCover: point.cloudCover
    }));
  }
  
  // Fetch forecast for a specific location and day
  async getForecastForLocation(
    latitude: number,
    longitude: number,
    forecastDay: number = 0,
    name: string = "Forecast location"
  ): Promise<ForecastDayAstroData | null> {
    try {
      // Use the batch process for a single location
      const locations = [{
        latitude,
        longitude,
        name,
        forecastDay
      }];
      
      const results = await enhancedForecastAstroService.batchProcessLocations(locations, forecastDay);
      
      if (results && results[0] && results[0].success && results[0].forecast) {
        return results[0].forecast;
      }
      
      return null;
    } catch (error) {
      console.error("Error getting forecast for location:", error);
      return null;
    }
  }
}

export const forecastMapService = new ForecastMapService();
export default forecastMapService;
