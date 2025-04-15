
import { SharedAstroSpot } from '@/types/weather';
import { generateRandomPoint } from '@/services/locationFilters';
import { isWaterLocation, isValidAstronomyLocation } from '@/utils/locationValidator';
import { getSiqsScore } from '@/utils/siqsHelpers';

/**
 * Service for generating and filtering calculated locations.
 */
export class CalculatedLocationsService {
  private centerLatitude: number;
  private centerLongitude: number;
  private searchRadiusKm: number;
  private numberOfPoints: number;
  private qualityThreshold: number;

  constructor(
    centerLatitude: number,
    centerLongitude: number,
    searchRadiusKm: number,
    numberOfPoints: number,
    qualityThreshold: number = 0
  ) {
    this.centerLatitude = centerLatitude;
    this.centerLongitude = centerLongitude;
    this.searchRadiusKm = searchRadiusKm;
    this.numberOfPoints = numberOfPoints;
    this.qualityThreshold = qualityThreshold;
  }

  /**
   * Main method to generate and filter astro spots
   */
  public async generateAndFilterAstroSpots(): Promise<SharedAstroSpot[]> {
    const generatedPoints = this.generateRandomPoints();
    const filteredPoints = this.filterAstroSpots(generatedPoints);
    return this.sortAstroSpots(filteredPoints);
  }

  /**
   * Creates a single astro spot from random point data
   */
  private createAstroSpot(randomPoint: { latitude: number; longitude: number; distance: number }): SharedAstroSpot {
    return {
      id: `calculated-${randomPoint.latitude.toFixed(6)}-${randomPoint.longitude.toFixed(6)}`,
      name: 'Calculated Location',
      latitude: randomPoint.latitude,
      longitude: randomPoint.longitude,
      bortleScale: 4,
      siqs: Math.floor(Math.random() * 101),
      timestamp: new Date().toISOString(),
      distance: randomPoint.distance,
      isDarkSkyReserve: false,
      certification: null,
      description: null,
      chineseName: `计算位置 ${randomPoint.latitude.toFixed(6)}-${randomPoint.longitude.toFixed(6)}`,
      isViable: true
    };
  }

  /**
   * Generates random points within the specified radius
   */
  private generateRandomPoints(): SharedAstroSpot[] {
    return Array.from({ length: this.numberOfPoints }, () => {
      const randomPoint = generateRandomPoint(
        this.centerLatitude,
        this.centerLongitude,
        this.searchRadiusKm
      );
      return this.createAstroSpot(randomPoint);
    });
  }

  /**
   * Validates a single astro spot against filtering criteria
   */
  private isValidAstroSpot(spot: SharedAstroSpot): boolean {
    if (!spot.latitude || !spot.longitude) {
      return false;
    }

    if (isWaterLocation(spot.latitude, spot.longitude)) {
      return false;
    }

    if (!isValidAstronomyLocation(spot.latitude, spot.longitude, spot.name)) {
      return false;
    }

    if (spot.siqs === undefined || getSiqsScore(spot.siqs) < this.qualityThreshold) {
      return false;
    }

    return true;
  }

  /**
   * Filters an array of astro spots based on criteria
   */
  private filterAstroSpots(astroSpots: SharedAstroSpot[]): SharedAstroSpot[] {
    return astroSpots.filter(spot => this.isValidAstroSpot(spot));
  }

  /**
   * Sorts astro spots by quality and distance
   */
  private sortAstroSpots(astroSpots: SharedAstroSpot[]): SharedAstroSpot[] {
    return [...astroSpots].sort((a, b) => {
      // Sort by SIQS score first (highest first)
      const siqsA = getSiqsScore(a.siqs) || 0;
      const siqsB = getSiqsScore(b.siqs) || 0;
      
      if (siqsB !== siqsA) {
        return siqsB - siqsA;
      }
      
      // Then by distance (closest first)
      return (a.distance || Infinity) - (b.distance || Infinity);
    });
  }
}

// Re-export location store functions
export {
  addLocationToStore,
  getLocationFromStore,
  getAllLocationsFromStore,
  clearLocationStore
} from './locationStore';
