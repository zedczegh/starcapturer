
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { ForecastDayAstroData, BatchLocationData, BatchForecastResult } from "./types/forecastTypes";

class EnhancedForecastAstroService {
  async batchProcessLocations(
    locations: BatchLocationData[], 
    forecastDay: number = 0
  ): Promise<BatchForecastResult[]> {
    console.log(`Processing ${locations.length} locations for forecast day ${forecastDay}`);
    
    // Process each location and return the results
    const results: BatchForecastResult[] = [];
    
    for (const location of locations) {
      try {
        // Add the forecast day to the location data
        const locationWithDay = {
          ...location,
          forecastDay: forecastDay
        };
        
        // Generate mock forecast data
        const forecast = this.generateMockForecast(locationWithDay, forecastDay);
        
        results.push({
          location: locationWithDay,
          success: true,
          forecast
        });
      } catch (error) {
        console.error("Error processing location for forecast:", error);
        results.push({
          location,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    
    return results;
  }
  
  async getFullForecastAstroData(
    latitude: number,
    longitude: number,
    bortleScale: number = 4
  ): Promise<ForecastDayAstroData[]> {
    console.log(`Getting full forecast for ${latitude}, ${longitude}`);
    
    // Generate mock forecast data for 15 days
    const forecasts: ForecastDayAstroData[] = [];
    
    for (let i = 0; i < 15; i++) {
      const location: BatchLocationData = {
        latitude, 
        longitude,
        bortleScale
      };
      
      forecasts.push(this.generateMockForecast(location, i));
    }
    
    return forecasts;
  }
  
  async getBestAstroDays(
    latitude: number,
    longitude: number,
    bortleScale: number = 4,
    minQuality: number = 5
  ): Promise<ForecastDayAstroData[]> {
    // Get all forecasts first
    const allForecasts = await this.getFullForecastAstroData(latitude, longitude, bortleScale);
    
    // Filter and sort by best quality
    return allForecasts
      .filter(day => day.siqs >= minQuality)
      .sort((a, b) => b.siqs - a.siqs);
  }
  
  private generateMockForecast(location: BatchLocationData, dayIndex: number): ForecastDayAstroData {
    // Generate a date for the forecast
    const date = new Date();
    date.setDate(date.getDate() + dayIndex);
    
    // Generate random cloud cover between 0 and 1
    const cloudCover = Math.random() * 0.7; // 0 to 0.7 (70% max)
    
    // Calculate SIQS score based on cloud cover and bortle scale
    const bortleScale = location.bortleScale || 4;
    const siqs = Math.max(1, Math.min(10, 10 - cloudCover * 10 - bortleScale * 0.5));
    
    // Generate mock moon data
    const moonPhase = Math.random();
    const moonIllumination = Math.random();
    
    const forecast: ForecastDayAstroData = {
      date: date.toISOString().split('T')[0],
      dayIndex,
      cloudCover,
      siqs,
      moonPhase,
      moonIllumination,
      temperature: {
        min: 15 + Math.random() * 10,
        max: 15 + Math.random() * 20
      },
      humidity: 50 + Math.random() * 30,
      windSpeed: Math.random() * 20,
      isViable: siqs > 5,
      qualityDescription: siqs > 7 ? "Excellent" : siqs > 5 ? "Good" : siqs > 3 ? "Fair" : "Poor",
      predictedSeeing: 3 + Math.random() * 2,
      precipitation: {
        probability: Math.round(cloudCover * 100),
        amount: cloudCover > 0.4 ? Math.random() * 10 : 0
      },
      weatherCode: Math.floor(cloudCover * 4),
      reliability: Math.max(10, 100 - dayIndex * 7)
    };
    
    return forecast;
  }
}

export const enhancedForecastAstroService = new EnhancedForecastAstroService();
