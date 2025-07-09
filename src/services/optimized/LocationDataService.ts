import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getCachedItem, setCachedItem } from '@/utils/optimizedCache';
import { globalAPIBatcher } from '@/utils/performanceOptimizer';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { isWaterLocation } from '@/utils/validation';

/**
 * Optimized location data service with intelligent caching and batching
 */
export class OptimizedLocationDataService {
  private static instance: OptimizedLocationDataService;
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly BATCH_DELAY = 50; // 50ms batch delay
  
  public static getInstance(): OptimizedLocationDataService {
    if (!OptimizedLocationDataService.instance) {
      OptimizedLocationDataService.instance = new OptimizedLocationDataService();
    }
    return OptimizedLocationDataService.instance;
  }

  /**
   * Get calculated locations with optimized caching and batching
   */
  async getCalculatedLocations(
    latitude: number,
    longitude: number,
    radius: number,
    limit: number = 20
  ): Promise<SharedAstroSpot[]> {
    const cacheKey = `calc-locations-${latitude.toFixed(3)}-${longitude.toFixed(3)}-${radius}-${limit}`;
    
    // Check cache first
    const cached = getCachedItem<SharedAstroSpot[]>(cacheKey);
    if (cached) {
      console.log(`Using cached calculated locations for ${cacheKey}`);
      return cached;
    }

    // Use batching for multiple simultaneous requests
    return globalAPIBatcher.batch(
      'calculated-locations',
      this.fetchCalculatedLocations.bind(this),
      latitude,
      longitude,
      radius,
      limit,
      cacheKey
    );
  }

  /**
   * Get certified locations with aggressive caching (they change rarely)
   */
  async getCertifiedLocations(
    latitude: number,
    longitude: number,
    radius: number = 10000 // Large radius for global certified locations
  ): Promise<SharedAstroSpot[]> {
    const cacheKey = `cert-locations-global`;
    
    // Check cache first - longer TTL for certified locations
    const cached = getCachedItem<SharedAstroSpot[]>(cacheKey);
    if (cached) {
      console.log('Using cached certified locations');
      return this.filterByDistance(cached, latitude, longitude, radius);
    }

    try {
      const { getRecommendedPhotoPoints } = await import('@/lib/api/astroSpots');
      const locations = await getRecommendedPhotoPoints(latitude, longitude, radius, true, 1000);
      
      if (locations?.length) {
        setCachedItem(cacheKey, locations, 60 * 60 * 1000); // 1 hour cache for certified
        return locations;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching certified locations:', error);
      return [];
    }
  }

  /**
   * Optimized SIQS calculation with smart caching
   */
  async calculateSIQS(
    latitude: number,
    longitude: number,
    bortleScale: number
  ): Promise<any> {
    const cacheKey = `siqs-${latitude.toFixed(4)}-${longitude.toFixed(4)}-${bortleScale.toFixed(1)}`;
    
    // Check cache first
    const cached = getCachedItem<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Use batching for SIQS calculations
    return globalAPIBatcher.batch(
      'siqs-calculation',
      this.calculateSIQSInternal.bind(this),
      latitude,
      longitude,
      bortleScale,
      cacheKey
    );
  }

  /**
   * Prefetch data for nearby locations to improve perceived performance
   */
  async prefetchNearbyData(
    latitude: number,
    longitude: number,
    radius: number = 100
  ): Promise<void> {
    // Don't await - this runs in background
    Promise.all([
      this.getCertifiedLocations(latitude, longitude, radius * 2),
      this.getCalculatedLocations(latitude, longitude, radius, 10)
    ]).catch(error => {
      console.warn('Background prefetch failed:', error);
    });
  }

  // Private methods

  private async fetchCalculatedLocations(
    latitude: number,
    longitude: number,
    radius: number,
    limit: number,
    cacheKey: string
  ): Promise<SharedAstroSpot[]> {
    try {
      console.log(`Fetching calculated locations for ${cacheKey}`);
      
      // Import the service dynamically to reduce initial bundle size
      const { generateQualitySpots } = await import('@/services/locationSpotService');
      
      const spots = await generateQualitySpots(latitude, longitude, radius, limit, 4);
      
      // Filter out water locations
      const validSpots = spots.filter(spot => 
        !isWaterLocation(spot.latitude, spot.longitude)
      );

      // Cache the results
      setCachedItem(cacheKey, validSpots, this.CACHE_TTL);
      
      console.log(`Generated ${validSpots.length} calculated locations`);
      return validSpots;
    } catch (error) {
      console.error('Error generating calculated locations:', error);
      return [];
    }
  }

  private async calculateSIQSInternal(
    latitude: number,
    longitude: number,
    bortleScale: number,
    cacheKey: string
  ): Promise<any> {
    try {
      const result = await calculateRealTimeSiqs(latitude, longitude, bortleScale, {
        useSingleHourSampling: true,
        targetHour: 1,
        cacheDurationMins: 15
      });

      // Cache the result
      setCachedItem(cacheKey, result, this.CACHE_TTL);
      
      return result;
    } catch (error) {
      console.error('Error calculating SIQS:', error);
      return { siqs: 0, isViable: false };
    }
  }

  private filterByDistance(
    locations: SharedAstroSpot[],
    centerLat: number,
    centerLng: number,
    maxDistance: number
  ): SharedAstroSpot[] {
    return locations.filter(location => {
      const distance = this.calculateDistance(
        centerLat,
        centerLng,
        location.latitude,
        location.longitude
      );
      return distance <= maxDistance;
    });
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

// Export singleton instance
export const optimizedLocationDataService = OptimizedLocationDataService.getInstance();