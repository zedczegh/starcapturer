
/**
 * Enhanced forecast adapter with better handling for forecast days
 */
import { ForecastDayAstroData, BatchLocationData, ExtendedSiqsResult, BatchForecastResult } from './types/forecastTypes';
import { forecastCache } from './utils/forecastCache';
import { reportServiceSuccess, reportServiceFailure } from './forecastHealthMonitor';

interface EnhancedLocation extends BatchLocationData {
  forecastDay?: number;
}

export const enhancedForecastAstroAdapter = {
  /**
   * Get forecast data for multiple days at a location
   * @param location Location data
   * @returns Promise with forecast data array
   */
  getForecastData: async (location: EnhancedLocation): Promise<ForecastDayAstroData[]> => {
    try {
      // Generate cache key based on location and time (daily)
      const cacheKey = `forecast_${location.latitude.toFixed(4)}_${location.longitude.toFixed(4)}_${new Date().toISOString().split('T')[0]}`;
      
      // Check cache first
      const cachedData = forecastCache.getCachedForecast<ForecastDayAstroData[]>(cacheKey);
      if (cachedData) {
        console.log('Using cached forecast data');
        return cachedData;
      }
      
      // Mock data generation for this adapter example
      const forecastDays = 15; // 15-day forecast
      const mockForecast: ForecastDayAstroData[] = [];
      
      const today = new Date();
      
      for (let i = 0; i < forecastDays; i++) {
        const forecastDate = new Date();
        forecastDate.setDate(today.getDate() + i);
        
        // Create realistic SIQS scores - better at start, more uncertain later
        let baseScore = Math.random() * 3 + 5; // Base score between 5-8
        
        // Further days have more variance and potentially lower scores
        if (i > 3) {
          baseScore -= (i - 3) * 0.2; // Decrease by 0.2 for each day beyond day 3
        }
        
        // Add some noise
        const noise = Math.random() * 2 - 1; // -1 to 1
        let finalScore = baseScore + noise;
        
        // Ensure within valid range
        finalScore = Math.max(1, Math.min(10, finalScore));
        
        const cloudCover = Math.min(100, Math.max(0, Math.round(100 - finalScore * 8 + Math.random() * 20)));
        
        mockForecast.push({
          date: forecastDate.toISOString().split('T')[0],
          dayIndex: i,
          cloudCover,
          siqs: finalScore,
          isViable: finalScore >= 5,
          temperature: {
            min: Math.round(10 + Math.random() * 5),
            max: Math.round(20 + Math.random() * 8)
          },
          precipitation: {
            probability: Math.round(cloudCover / 2),
            amount: cloudCover > 50 ? Math.random() * 5 : 0
          },
          humidity: Math.round(40 + Math.random() * 40),
          windSpeed: Math.round(5 + Math.random() * 15),
          weatherCode: cloudCover > 70 ? 3 : cloudCover > 40 ? 2 : 1,
          siqsResult: {
            siqs: finalScore,
            isViable: finalScore >= 5,
            bortleScale: location.bortleScale || 4,
            cloudCover,
            timestamp: Date.now()
          } as ExtendedSiqsResult,
          reliability: Math.max(10, 100 - i * 7) // Reliability decreases with forecast day
        });
      }
      
      // Cache the results
      forecastCache.setCachedForecast(cacheKey, mockForecast);
      reportServiceSuccess('/forecast/enhanced');
      
      return mockForecast;
    } catch (error) {
      console.error('Error fetching enhanced forecast data:', error);
      reportServiceFailure('/forecast/enhanced');
      return [];
    }
  },
  
  /**
   * Get forecast for a specific day
   * @param location Location with forecastDay specified
   * @returns Promise with forecast data for the specific day
   */
  getForecastDay: async (location: EnhancedLocation): Promise<ForecastDayAstroData | null> => {
    try {
      const forecastDay = location.forecastDay !== undefined ? location.forecastDay : 0;
      const allForecast = await enhancedForecastAstroAdapter.getForecastData(location);
      
      // Find the requested day
      const dayForecast = allForecast.find(day => day.dayIndex === forecastDay);
      
      if (!dayForecast) {
        console.warn(`Forecast day ${forecastDay} not found`);
        return null;
      }
      
      return dayForecast;
    } catch (error) {
      console.error('Error fetching day forecast:', error);
      reportServiceFailure('/forecast/day');
      return null;
    }
  },
  
  /**
   * Process batch forecast requests
   * @param locations Array of locations to process
   * @returns Results array with success/failure status
   */
  processBatchForecast: async (locations: EnhancedLocation[]): Promise<BatchForecastResult[]> => {
    const results: BatchForecastResult[] = [];
    
    for (const location of locations) {
      try {
        let forecast: ForecastDayAstroData | ForecastDayAstroData[] | null;
        
        if (location.forecastDay !== undefined) {
          // Get single day forecast if forecastDay is specified
          forecast = await enhancedForecastAstroAdapter.getForecastDay(location);
        } else {
          // Get full forecast if no specific day is requested
          forecast = await enhancedForecastAstroAdapter.getForecastData(location);
        }
        
        results.push({
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            bortleScale: location.bortleScale,
            name: location.name,
            forecastDay: location.forecastDay
          },
          forecast,
          success: true
        });
      } catch (error) {
        console.error(`Error processing forecast for location ${location.name || '(unnamed)'}:`, error);
        results.push({
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            bortleScale: location.bortleScale,
            name: location.name
          },
          forecast: null,
          success: false
        });
      }
    }
    
    return results;
  },
  
  /**
   * Clear forecast cache
   * @param pattern Optional pattern to match keys against
   */
  clearCache: (pattern?: string): void => {
    forecastCache.invalidateCache(pattern);
  }
};

// For backward compatibility
export default enhancedForecastAstroAdapter;
