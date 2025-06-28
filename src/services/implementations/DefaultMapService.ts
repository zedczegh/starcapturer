
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
      // Use the SIQS service through the container to maintain abstraction
      const { ServiceContainer } = await import('../ServiceContainer');
      const siqsService = ServiceContainer.getInstance().getSiqsService();
      
      const result = await siqsService.calculateSiqs(latitude, longitude, bortleScale, options);
      
      return {
        siqs: result.siqs || 0,
        confidence: result.confidence || 7
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
      // Use the geocoding service through the container
      const { ServiceContainer } = await import('../ServiceContainer');
      const geocodingService = ServiceContainer.getInstance().getGeocodingService();
      
      const result = await geocodingService.getLocationDetails(latitude, longitude);
      return result.formattedName;
    } catch (error) {
      console.error('Default map service location name error:', error);
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  }

  getProvider(): string {
    return 'default';
  }
}
