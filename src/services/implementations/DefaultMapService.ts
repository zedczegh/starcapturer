
import { IMapService, LocationData, SIQSCalculationOptions } from '../interfaces/IMapService';
import { ConfigManager } from '../config/AppConfig';

export class DefaultMapService implements IMapService {
  private config = ConfigManager.getInstance().getMapConfig();

  async calculateSIQS(
    latitude: number, 
    longitude: number, 
    bortleScale: number,
    options?: SIQSCalculationOptions
  ): Promise<{ siqs: number; confidence?: number }> {
    try {
      // Use existing SIQS calculation logic
      const { calculateRealTimeSiqs } = await import('@/services/realTimeSiqs/siqsCalculator');
      
      const result = await calculateRealTimeSiqs(
        latitude,
        longitude,
        bortleScale,
        options || {
          useSingleHourSampling: true,
          targetHour: 1,
          cacheDurationMins: 5
        }
      );
      
      return {
        siqs: result.siqs || 0,
        confidence: 7 // Default confidence score
      };
    } catch (error) {
      console.error('Default map service SIQS calculation error:', error);
      throw error;
    }
  }

  async getLightPollutionData(latitude: number, longitude: number): Promise<{ bortleScale: number }> {
    try {
      // Use existing light pollution fetching logic
      const { fetchLightPollutionData } = await import('@/lib/api');
      const data = await fetchLightPollutionData(latitude, longitude);
      
      return {
        bortleScale: data?.bortleScale || 5
      };
    } catch (error) {
      console.error('Default map service light pollution error:', error);
      return { bortleScale: 5 }; // Default fallback
    }
  }

  async getLocationName(latitude: number, longitude: number): Promise<string> {
    try {
      // Use existing reverse geocoding service
      const { getEnhancedLocationDetails } = await import('@/services/geocoding/enhancedReverseGeocoding');
      const result = await getEnhancedLocationDetails(latitude, longitude);
      return result.formattedName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    } catch (error) {
      console.error('Default map service location name error:', error);
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  }

  getProvider(): string {
    return 'default';
  }
}
