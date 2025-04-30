
import { ForecastDayAstroData, EnhancedLocation, BatchLocationData, ExtendedSiqsResult, BatchForecastResult } from './types/forecastTypes';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Enhanced adapter for forecast data that provides richer functionality
 */
class EnhancedForecastAstroService {
  /**
   * Get full forecast data for a specific location and multiple days
   */
  async getFullForecastAstroData(
    location: EnhancedLocation,
    days: number = 7
  ): Promise<ForecastDayAstroData[]> {
    console.log(`Getting ${days} day forecast for location at ${location.latitude}, ${location.longitude}`);
    
    // Create mock forecast data for the requested number of days
    const forecasts: ForecastDayAstroData[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      // Create mock data with different values for each day
      const cloudCover = Math.random() * 0.5; // 0-50% cloud cover
      const siqs = Math.round(90 - cloudCover * 100); // Higher when less cloudy
      
      // Create complete ForecastDayAstroData object
      const forecast: ForecastDayAstroData = {
        date: date.toISOString().split('T')[0],
        dayIndex: i,
        cloudCover,
        siqs,
        moonPhase: i / 28, // Simulated moon phases
        moonIllumination: (i % 14) * 7, // Simulated illumination percentage
        temperature: { 
          min: Math.round(15 + Math.sin(i / 3) * 5), 
          max: Math.round(25 + Math.sin(i / 3) * 5)
        },
        humidity: Math.round(50 + Math.sin(i / 2) * 20),
        windSpeed: Math.round(5 + Math.sin(i) * 10),
        isViable: cloudCover < 0.3, // Viability threshold
        qualityDescription: cloudCover < 0.2 ? 'Excellent' : 
                           cloudCover < 0.4 ? 'Good' : 
                           cloudCover < 0.6 ? 'Fair' : 'Poor',
        predictedSeeing: 3 + Math.sin(i / 2) * 2,
        precipitation: {
          probability: cloudCover * 0.8,
          amount: cloudCover > 0.3 ? cloudCover * 10 : null,
        },
        weatherCode: Math.floor(cloudCover * 10),
        reliability: 0.9 - (i * 0.1), // Decreasing reliability for later days
        siqsResult: {
          siqs,
          isViable: cloudCover < 0.3,
          bortleScale: location.bortleScale || 4,
          cloudCover,
          timestamp: Date.now()
        } as ExtendedSiqsResult
      };
      
      forecasts.push(forecast);
    }
    
    return forecasts;
  }

  /**
   * Get best astronomy days from a forecast range
   */
  async getBestAstroDays(
    location: EnhancedLocation,
    days: number = 7,
    threshold: number = 7
  ): Promise<ForecastDayAstroData[]> {
    // Get full forecast first
    const allForecasts = await this.getFullForecastAstroData(location, days);
    
    // Filter and sort by quality (SIQS score)
    const bestDays = allForecasts
      .filter(day => day.siqs >= threshold)
      .sort((a, b) => b.siqs - a.siqs);
    
    return bestDays;
  }
  
  /**
   * Convert forecast data to SharedAstroSpot format for map display
   */
  convertForecastToMapPoint(
    location: EnhancedLocation,
    forecast: ForecastDayAstroData
  ): SharedAstroSpot {
    // Create a timestamp for today
    const timestamp = new Date().toISOString();
    
    return {
      id: `forecast-${location.latitude}-${location.longitude}-day-${forecast.dayIndex}`,
      name: location.name || `Location (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`,
      latitude: location.latitude,
      longitude: location.longitude,
      bortleScale: location.bortleScale || 4,
      timestamp,
      siqs: forecast.siqs,
      isViable: forecast.isViable,
      isForecast: true,
      forecastDay: forecast.dayIndex,
      forecastDate: forecast.date,
      cloudCover: forecast.cloudCover
    };
  }
  
  /**
   * Get forecast for a single day at a specific location
   */
  async getSingleDayForecast(
    location: EnhancedLocation, 
    dayIndex: number = 0
  ): Promise<ForecastDayAstroData> {
    const forecasts = await this.getFullForecastAstroData(location, dayIndex + 1);
    return forecasts[dayIndex] || forecasts[0];
  }
}

export default new EnhancedForecastAstroService();
