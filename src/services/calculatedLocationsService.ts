
import { SharedAstroSpot } from '@/types/weather';
import { generateCalculatedSpots } from './locationSpotService';

/**
 * Enhanced service for generating and filtering astronomy locations
 */
export class CalculatedLocationsService {
  private centerLatitude: number;
  private centerLongitude: number;
  private searchRadiusKm: number;

  constructor(
    centerLatitude: number,
    centerLongitude: number,
    searchRadiusKm: number
  ) {
    this.centerLatitude = centerLatitude;
    this.centerLongitude = centerLongitude;
    this.searchRadiusKm = searchRadiusKm;
  }

  /**
   * Generate optimized astro spots
   */
  public async generateAndFilterAstroSpots(): Promise<SharedAstroSpot[]> {
    console.log(`Generating spots within ${this.searchRadiusKm}km of [${this.centerLatitude.toFixed(4)}, ${this.centerLongitude.toFixed(4)}]`);
    
    try {
      const spots = await generateCalculatedSpots(
        this.centerLatitude,
        this.centerLongitude,
        this.searchRadiusKm
      );
      
      console.log(`Generated ${spots.length} optimized locations`);
      return spots;
    } catch (error) {
      console.error("Error generating astronomy spots:", error);
      return [];
    }
  }
}

// Re-export location store functions for compatibility
export {
  addLocationToStore,
  getLocationFromStore,
  getAllLocationsFromStore,
  clearLocationStore
} from './locationStore';
