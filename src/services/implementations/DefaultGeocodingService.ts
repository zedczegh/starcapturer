
import { IGeocodingService, LocationDetails } from '../interfaces/IGeocodingService';

export class DefaultGeocodingService implements IGeocodingService {
  async getLocationDetails(latitude: number, longitude: number): Promise<LocationDetails> {
    try {
      const { getEnhancedLocationDetails } = await import('@/services/geocoding/enhancedReverseGeocoding');
      const result = await getEnhancedLocationDetails(latitude, longitude);
      
      return {
        formattedName: result.formattedName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        address: result.address,
        city: result.city,
        region: result.region,
        country: result.country,
        latitude,
        longitude
      };
    } catch (error) {
      console.error('Default geocoding service error:', error);
      return {
        formattedName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        latitude,
        longitude
      };
    }
  }

  async searchLocation(query: string): Promise<LocationDetails[]> {
    try {
      const { searchLocations } = await import('@/services/geocoding/searchLocations');
      const results = await searchLocations(query);
      
      return results.map(result => ({
        formattedName: result.name || 'Unknown Location',
        address: result.address,
        city: result.city,
        region: result.region,
        country: result.country,
        latitude: result.latitude,
        longitude: result.longitude
      }));
    } catch (error) {
      console.error('Default geocoding search error:', error);
      return [];
    }
  }

  getProvider(): string {
    return 'default';
  }
}
