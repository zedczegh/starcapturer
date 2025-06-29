
import { ISiqsService, SiqsCalculationOptions, SiqsResult } from '../interfaces/ISiqsService';

export class DefaultSiqsService implements ISiqsService {
  async calculateSiqs(
    latitude: number,
    longitude: number,
    bortleScale: number,
    options?: SiqsCalculationOptions
  ): Promise<SiqsResult> {
    try {
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
        confidence: 7,
        weatherData: result.weatherData,
        forecastData: result.forecastData,
        metadata: {
          calculatedAt: new Date().toISOString(),
          provider: 'default'
        }
      };
    } catch (error) {
      console.error('Default SIQS service error:', error);
      throw error;
    }
  }

  async batchCalculateSiqs(locations: Array<{
    latitude: number;
    longitude: number;
    bortleScale: number;
  }>): Promise<Map<string, SiqsResult>> {
    try {
      const { batchCalculateSiqs } = await import('@/services/realTimeSiqs/batchProcessor');
      
      // Transform input to match expected SharedAstroSpot format
      const jobs = locations.map((loc, index) => ({
        id: `${index}`,
        name: `Location ${index}`,
        latitude: loc.latitude,
        longitude: loc.longitude,
        bortleScale: loc.bortleScale,
        timestamp: new Date().toISOString()
      }));
      
      const results = new Map<string, SiqsResult>();
      const batchResults = await batchCalculateSiqs(jobs);
      
      batchResults.forEach((result, key) => {
        results.set(key, {
          siqs: result.siqs || 0,
          confidence: 7,
          weatherData: result.weatherData,
          metadata: {
            calculatedAt: new Date().toISOString(),
            provider: 'default'
          }
        });
      });
      
      return results;
    } catch (error) {
      console.error('Default SIQS batch service error:', error);
      throw error;
    }
  }

  clearCache(): void {
    try {
      import('@/services/realTimeSiqsService').then(({ clearLocationCache }) => {
        clearLocationCache();
      });
    } catch (error) {
      console.error('Error clearing SIQS cache:', error);
    }
  }

  getCacheSize(): number {
    try {
      // This would need to be implemented based on the cache service
      return 0;
    } catch (error) {
      console.error('Error getting cache size:', error);
      return 0;
    }
  }

  getProvider(): string {
    return 'default';
  }
}
