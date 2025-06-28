import { IMapService, LocationData, SIQSCalculationOptions } from '../interfaces/IMapService';
import { ConfigManager } from '../config/AppConfig';

export class GaodeMapService implements IMapService {
  private config = ConfigManager.getInstance().getMapConfig();
  private apiKey = 'a2eb97399cb864ca56dad88c0f256fe1';

  async calculateSIQS(
    latitude: number, 
    longitude: number, 
    bortleScale: number,
    options?: SIQSCalculationOptions
  ): Promise<{ siqs: number; confidence?: number }> {
    try {
      // Use existing SIQS calculation logic - this remains the same regardless of map provider
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
        confidence: 8 // Slightly higher confidence for Gaode Maps in China
      };
    } catch (error) {
      console.error('Gaode map service SIQS calculation error:', error);
      throw error;
    }
  }

  async getLightPollutionData(latitude: number, longitude: number): Promise<{ bortleScale: number }> {
    try {
      // Use existing light pollution fetching logic
      const { fetchLightPollutionData } = await import('@/lib/api');
      const data = await fetchLightPollutionData(latitude, longitude);
      
      return {
        bortleScale: data?.bortleScale || 4 // Default to better conditions for rural China
      };
    } catch (error) {
      console.error('Gaode map service light pollution error:', error);
      return { bortleScale: 4 }; // Default fallback for China
    }
  }

  async getLocationName(latitude: number, longitude: number): Promise<string> {
    try {
      // Use Gaode's reverse geocoding API
      const response = await fetch(
        `https://restapi.amap.com/v3/geocode/regeo?output=json&location=${longitude},${latitude}&key=${this.apiKey}&radius=1000&extensions=base`
      );
      
      if (!response.ok) {
        throw new Error(`Gaode API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === '1' && data.regeocode) {
        const address = data.regeocode.formatted_address;
        if (address) {
          return address;
        }
      }
      
      // Fallback to coordinates if no address found
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    } catch (error) {
      console.error('Gaode map service location name error:', error);
      // Fallback to enhanced reverse geocoding as backup
      try {
        const { getEnhancedLocationDetails } = await import('@/services/geocoding/enhancedReverseGeocoding');
        const result = await getEnhancedLocationDetails(latitude, longitude);
        return result.formattedName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      } catch (fallbackError) {
        console.error('Fallback geocoding also failed:', fallbackError);
        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
    }
  }

  getProvider(): string {
    return 'gaode';
  }
}
