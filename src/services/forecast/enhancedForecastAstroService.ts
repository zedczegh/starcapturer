
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { ForecastDayAstroData } from "./types/forecastTypes";

// Define the batch location data interface
interface BatchLocationData {
  latitude: number; 
  longitude: number;
  name?: string;
  bortleScale?: number;
  forecastDay?: number;
}

// Define the batch result interface
export interface BatchForecastResult {
  location: BatchLocationData;
  success: boolean;
  forecast?: ForecastDayAstroData;
  error?: string;
}

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
    
    return {
      date: date.toISOString().split('T')[0],
      dayIndex,
      cloudCover,
      siqs,
      moonPhase,
      moonIllumination,
      temperature: 15 + Math.random() * 10,
      humidity: 50 + Math.random() * 30,
      windSpeed: Math.random() * 20,
      isViable: siqs > 5,
      qualityDescription: siqs > 7 ? "Excellent" : siqs > 5 ? "Good" : siqs > 3 ? "Fair" : "Poor",
      predictedSeeing: 3 + Math.random() * 2
    };
  }
}

export const enhancedForecastAstroService = new EnhancedForecastAstroService();
