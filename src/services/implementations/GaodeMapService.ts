
import { IMapService, LocationData, SIQSCalculationOptions } from '../interfaces/IMapService';
import { ConfigManager } from '../config/AppConfig';

export class GaodeMapService implements IMapService {
  private config = ConfigManager.getInstance().getMapConfig();
  private apiKey = 'a2eb97399cb864ca56dad88c0f256fe1'; // Your provided Gaode API key

  async calculateSIQS(
    latitude: number, 
    longitude: number, 
    bortleScale: number,
    options?: SIQSCalculationOptions
  ): Promise<{ siqs: number; confidence?: number }> {
    try {
      console.log(`GaodeMapService: Calculating SIQS for ${latitude}, ${longitude}`);
      
      // Use the SIQS service through the container to maintain abstraction
      const { ServiceContainer } = await import('../ServiceContainer');
      const siqsService = ServiceContainer.getInstance().getSiqsService();
      
      const result = await siqsService.calculateSiqs(latitude, longitude, bortleScale, options);
      
      console.log(`GaodeMapService: SIQS calculation result:`, result);
      
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
      console.log(`GaodeMapService: Getting light pollution data for ${latitude}, ${longitude}`);
      
      // Use existing light pollution fetching logic
      const { fetchLightPollutionData } = await import('@/lib/api');
      const data = await fetchLightPollutionData(latitude, longitude);
      
      console.log(`GaodeMapService: Light pollution data:`, data);
      
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
      console.log(`GaodeMapService: Getting location name for ${latitude}, ${longitude} using Gaode API`);
      
      // Use Gaode's reverse geocoding API
      const response = await fetch(
        `https://restapi.amap.com/v3/geocode/regeo?output=json&location=${longitude},${latitude}&key=${this.apiKey}&radius=1000&extensions=base`
      );
      
      if (!response.ok) {
        throw new Error(`Gaode API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`GaodeMapService: Gaode API response:`, data);
      
      if (data.status === '1' && data.regeocode) {
        const address = data.regeocode.formatted_address;
        if (address) {
          console.log(`GaodeMapService: Successfully got location name: ${address}`);
          return address;
        }
      }
      
      // Fallback to coordinates if no address found
      const fallbackName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      console.log(`GaodeMapService: Using fallback name: ${fallbackName}`);
      return fallbackName;
    } catch (error) {
      console.error('Gaode map service location name error:', error);
      // Fallback to geocoding service as backup
      try {
        console.log('GaodeMapService: Trying fallback geocoding service');
        const { ServiceContainer } = await import('../ServiceContainer');
        const geocodingService = ServiceContainer.getInstance().getGeocodingService();
        const result = await geocodingService.getLocationDetails(latitude, longitude);
        return result.formattedName;
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
