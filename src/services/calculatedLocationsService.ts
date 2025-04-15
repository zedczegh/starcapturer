import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
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
  
  /**
   * Constructor for the CalculatedLocationsService.
   * @param centerLatitude Latitude of the center point.
   * @param centerLongitude Longitude of the center point.
   * @param searchRadiusKm Search radius in kilometers.
   * @param numberOfPoints Number of points to generate.
   * @param qualityThreshold Minimum SIQS score threshold.
   */
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
   * Generates random astro spots within the specified radius and filters them based on certain criteria.
   * @returns An array of SharedAstroSpot objects.
   */
  public async generateAndFilterAstroSpots(): Promise<SharedAstroSpot[]> {
    const generatedPoints = this.generateRandomPoints();
    const filteredPoints = this.filterAstroSpots(generatedPoints);
    const sortedPoints = this.sortAstroSpots(filteredPoints);
    
    return sortedPoints;
  }
  
  /**
   * Generates random points within the specified radius.
   * @returns An array of SharedAstroSpot objects.
   */
  private generateRandomPoints(): SharedAstroSpot[] {
    const astroSpots: SharedAstroSpot[] = [];
    
    for (let i = 0; i < this.numberOfPoints; i++) {
      const randomPoint = generateRandomPoint(
        this.centerLatitude,
        this.centerLongitude,
        this.searchRadiusKm
      );
      
      astroSpots.push({
        id: `calculated-${randomPoint.latitude.toFixed(6)}-${randomPoint.longitude.toFixed(6)}`,
        name: 'Calculated Location',
        latitude: randomPoint.latitude,
        longitude: randomPoint.longitude,
        siqs: Math.floor(Math.random() * 101), // SIQS ranges from 0 to 100
        distance: randomPoint.distance,
        isDarkSkyReserve: false,
        certification: null,
        description: null,
        photoUrls: [],
        types: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: null,
        views: 0,
        isPublic: true,
        address: null,
        plusCode: null,
        waterProximity: null,
        horizonQuality: null,
        lightPollution: null,
        seeingConditions: null,
        nearestCity: null,
        waterBodies: [],
        elevation: null,
        nearestCities: [],
        waterbodyProximities: [],
        horizonQualities: [],
        lightPollutions: [],
        seeingConditionQualities: [],
        isFeatured: false
      });
    }
    
    return astroSpots;
  }
  
  /**
   * Filters an array of SharedAstroSpot objects based on certain criteria.
   * @param astroSpots An array of SharedAstroSpot objects to filter.
   * @returns A filtered array of SharedAstroSpot objects.
   */
  private filterAstroSpots(astroSpots: SharedAstroSpot[]): SharedAstroSpot[] {
    return astroSpots.filter(spot => {
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
    });
  }
  
  /**
   * Sorts an array of SharedAstroSpot objects based on quality and distance.
   * @param astroSpots An array of SharedAstroSpot objects to sort.
   * @returns A sorted array of SharedAstroSpot objects.
   */
  private sortAstroSpots(astroSpots: SharedAstroSpot[]): SharedAstroSpot[] {
    return sortByQualityAndDistance(astroSpots);
  }
}

/**
 * Sorts locations by quality and distance
 * @param locations Array of locations
 * @returns Sorted array of locations
 */
const sortByQualityAndDistance = (locations: SharedAstroSpot[]) => {
  return [...locations].sort((a, b) => {
    // Sort by SIQS score first (highest first)
    const siqsA = getSiqsScore(a.siqs) || 0;
    const siqsB = getSiqsScore(b.siqs) || 0;
    
    if (siqsB !== siqsA) {
      return siqsB - siqsA;
    }
    
    // Then by distance (closest first)
    return (a.distance || Infinity) - (b.distance || Infinity);
  });
};
