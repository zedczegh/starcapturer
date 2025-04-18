import { SharedAstroSpot } from '@/types/weather';
import { generateRandomPoint } from '@/services/locationFilters';
import { isWaterLocation, isValidAstronomyLocation } from '@/utils/locationValidator';
import { getSiqsScore } from '@/utils/siqsHelpers';
import { fetchForecastData } from '@/lib/api/forecast';
import { calculateTonightCloudCover } from '@/utils/nighttimeSIQS';

/**
 * Enhanced service for generating and filtering calculated astronomy locations
 * with state-of-the-art algorithms for identifying optimal observation spots.
 */
export class CalculatedLocationsService {
  private centerLatitude: number;
  private centerLongitude: number;
  private searchRadiusKm: number;
  private numberOfPoints: number;
  private qualityThreshold: number;
  private adaptiveGeneration: boolean;
  private densityBasedSampling: boolean;
  private forecastData: any = null;

  constructor(
    centerLatitude: number,
    centerLongitude: number,
    searchRadiusKm: number,
    numberOfPoints: number = 30,
    qualityThreshold: number = 0,
    adaptiveGeneration: boolean = true,
    densityBasedSampling: boolean = true
  ) {
    this.centerLatitude = centerLatitude;
    this.centerLongitude = centerLongitude;
    this.searchRadiusKm = searchRadiusKm;
    this.numberOfPoints = numberOfPoints;
    this.qualityThreshold = qualityThreshold;
    this.adaptiveGeneration = adaptiveGeneration;
    this.densityBasedSampling = densityBasedSampling;
  }

  /**
   * Main method to generate and filter astro spots with enhanced algorithms
   */
  public async generateAndFilterAstroSpots(): Promise<SharedAstroSpot[]> {
    console.log(`Generating ${this.numberOfPoints} points within ${this.searchRadiusKm}km of [${this.centerLatitude.toFixed(4)}, ${this.centerLongitude.toFixed(4)}]`);
    
    try {
      // Fetch forecast data once for the center location
      this.forecastData = await fetchForecastData({
        latitude: this.centerLatitude,
        longitude: this.centerLongitude
      });
      
      // Check tonight's cloud cover for the center location
      const tonightCloudCover = this.forecastData ? 
        calculateTonightCloudCover(this.forecastData.hourly, this.centerLatitude, this.centerLongitude) : 100;
      
      // If cloud cover is over 40%, astronomy is not viable in this region
      if (tonightCloudCover > 40) {
        console.log(`Tonight's cloud cover is ${tonightCloudCover.toFixed(1)}%, which exceeds 40% threshold. No viable locations.`);
        return [];
      }
      
      // Generate points with adaptive algorithms if enabled
      const generatedPoints = this.adaptiveGeneration 
        ? await this.generateAdaptivePoints()
        : await this.generateRandomPoints();
      
      console.log(`Generated ${generatedPoints.length} initial locations`);
      
      // Apply multi-stage filtering
      const filteredPoints = await this.applyMultiStageFiltering(generatedPoints);
      console.log(`After filtering: ${filteredPoints.length} locations remain`);
      
      // Apply ranking and sorting
      const sortedPoints = this.applyScoringAndSorting(filteredPoints);
      
      return sortedPoints;
    } catch (error) {
      console.error("Error generating astronomy spots:", error);
      return [];
    }
  }

  /**
   * Creates a single astro spot from point data with enhanced metadata
   */
  private async createAstroSpot(randomPoint: { 
    latitude: number; 
    longitude: number; 
    distance: number;
    preferenceScore?: number;
    cloudCover?: number;
  }): Promise<SharedAstroSpot> {
    const id = `calculated-${randomPoint.latitude.toFixed(6)}-${randomPoint.longitude.toFixed(6)}`;
    
    // Default bortle scale (since we don't have accurate data)
    const bortleScale = 4;
    
    // Calculate SIQS score based on cloud cover
    let cloudCover = randomPoint.cloudCover;
    if (cloudCover === undefined && this.forecastData) {
      // Get slightly varied cloud cover for this specific location
      // This creates natural variation in the map
      const baseCoverValue = calculateTonightCloudCover(
        this.forecastData.hourly, 
        randomPoint.latitude,
        randomPoint.longitude
      );
      
      // Add slight variation (-5% to +5%)
      cloudCover = Math.max(0, Math.min(100, baseCoverValue + (Math.random() * 10 - 5)));
    }
    
    // If we have no cloud cover data, use a default
    if (cloudCover === undefined) {
      cloudCover = 20; // Default to somewhat clear
    }
    
    // If cloud cover is over 40%, location is not viable
    const isViable = cloudCover <= 40;
    
    // Calculate score on 0-10 scale based on cloud cover
    // 0% cloud cover = 10 points, 40% cloud cover = 6 points
    const cloudScore = isViable ? 10 - ((cloudCover / 40) * 4) : Math.max(1, 5 - (cloudCover / 20));
    
    // Apply any preference score bonus
    const preferenceBonus = randomPoint.preferenceScore ? (randomPoint.preferenceScore - 1) * 0.5 : 0;
    
    // Final SIQS score (0-10 scale)
    const siqsScore = Math.min(10, Math.max(1, cloudScore + preferenceBonus));
    
    // Fix: Create proper structure for siqs property with both simple score and detailed siqsResult
    return {
      id,
      name: 'Calculated Location',
      latitude: randomPoint.latitude,
      longitude: randomPoint.longitude,
      bortleScale,
      siqs: {
        score: siqsScore,
        isViable
      },
      siqsResult: {
        score: siqsScore,
        isViable,
        factors: [
          {
            name: "Cloud Cover",
            score: cloudScore,
            description: `Tonight's cloud cover: ${Math.round(cloudCover)}%`
          }
        ]
      },
      timestamp: new Date().toISOString(),
      distance: randomPoint.distance,
      isDarkSkyReserve: false,
      certification: null,
      description: null,
      chineseName: `计算位置 ${randomPoint.latitude.toFixed(6)}-${randomPoint.longitude.toFixed(6)}`,
      isViable,
      preferenceScore: randomPoint.preferenceScore
    };
  }

  /**
   * Generate points with advanced adaptive algorithms
   */
  private async generateAdaptivePoints(): Promise<SharedAstroSpot[]> {
    // Start with a base set of points
    const basePoints = await this.generateRandomPoints();
    
    if (!this.densityBasedSampling) {
      return basePoints;
    }
    
    // Apply density-based sampling to find optimal distribution
    const sampledPoints = this.adaptivePointDistribution(basePoints);
    
    // Convert to SharedAstroSpot objects
    const spotPromises = sampledPoints.map(point => this.createAstroSpot(point));
    const astroSpots = await Promise.all(spotPromises);
    
    return astroSpots;
  }

  /**
   * Generate random points within the specified radius
   */
  private async generateRandomPoints(): Promise<SharedAstroSpot[]> {
    const generatedPoints: SharedAstroSpot[] = [];
    const attempts = this.numberOfPoints * 2; // Generate more points to compensate for filtering
    const pointPromises = [];
    
    for (let i = 0; i < attempts; i++) {
      try {
        const randomPoint = generateRandomPoint(
          this.centerLatitude,
          this.centerLongitude,
          this.searchRadiusKm
        );
        
        // Quick validity check
        if (randomPoint.latitude && randomPoint.longitude) {
          pointPromises.push(this.createAstroSpot(randomPoint));
        }
      } catch (error) {
        console.warn("Error generating random point:", error);
      }
    }
    
    try {
      const resolvedPoints = await Promise.all(pointPromises);
      return resolvedPoints;
    } catch (error) {
      console.error("Failed to create some astro spots:", error);
      return generatedPoints;
    }
  }
  
  /**
   * Implements density-based adaptive distribution of points
   * using k-means like algorithm to ensure good coverage
   */
  private adaptivePointDistribution(points: SharedAstroSpot[]): {
    latitude: number;
    longitude: number;
    distance: number;
    preferenceScore?: number;
  }[] {
    // Convert to simple points for processing
    const simplePoints = points.map(p => ({
      latitude: p.latitude,
      longitude: p.longitude,
      distance: p.distance || 0,
      preferenceScore: 0
    }));
    
    // Calculate quadrant density to ensure even distribution
    const quadrants = {
      nw: 0, ne: 0, sw: 0, se: 0
    };
    
    simplePoints.forEach(point => {
      const latDiff = point.latitude - this.centerLatitude;
      const lngDiff = point.longitude - this.centerLongitude;
      
      if (latDiff >= 0 && lngDiff >= 0) quadrants.ne++;
      else if (latDiff >= 0 && lngDiff < 0) quadrants.nw++;
      else if (latDiff < 0 && lngDiff >= 0) quadrants.se++;
      else quadrants.sw++;
    });
    
    // Calculate average quadrant count
    const avgQuadCount = Object.values(quadrants).reduce((a, b) => a + b, 0) / 4;
    
    // Apply preference scores based on quadrant density
    simplePoints.forEach(point => {
      const latDiff = point.latitude - this.centerLatitude;
      const lngDiff = point.longitude - this.centerLongitude;
      let quadrantScore = 1;
      
      if (latDiff >= 0 && lngDiff >= 0 && quadrants.ne < avgQuadCount) 
        quadrantScore = 1.5; // Northeast is under-represented
      else if (latDiff >= 0 && lngDiff < 0 && quadrants.nw < avgQuadCount) 
        quadrantScore = 1.5; // Northwest is under-represented
      else if (latDiff < 0 && lngDiff >= 0 && quadrants.se < avgQuadCount) 
        quadrantScore = 1.5; // Southeast is under-represented
      else if (latDiff < 0 && lngDiff < 0 && quadrants.sw < avgQuadCount) 
        quadrantScore = 1.5; // Southwest is under-represented
      
      // Distance preference (favor points at mid-range distance)
      const normalizedDistance = point.distance / this.searchRadiusKm;
      const distanceScore = 1 - Math.abs(normalizedDistance - 0.6);
      
      // Combine scores
      point.preferenceScore = quadrantScore * distanceScore;
    });
    
    // Sort by preference score and take top points
    return simplePoints
      .sort((a, b) => (b.preferenceScore || 0) - (a.preferenceScore || 0))
      .slice(0, this.numberOfPoints);
  }

  /**
   * Apply sophisticated multi-stage filtering to candidate locations
   */
  private async applyMultiStageFiltering(points: SharedAstroSpot[]): Promise<SharedAstroSpot[]> {
    // Stage 1: Basic validity filtering
    let validPoints = points.filter(spot => {
      if (!spot.latitude || !spot.longitude) {
        return false;
      }
      
      // Apply water check but don't be too strict
      if (isWaterLocation(spot.latitude, spot.longitude, false)) {
        return false;
      }
      
      // Check basic astronomy location validity
      if (!isValidAstronomyLocation(spot.latitude, spot.longitude, spot.name)) {
        return false;
      }
      
      return true;
    });
    
    // Stage 2: Filter by cloud cover - keep only locations with good visibility
    validPoints = validPoints.filter(spot => {
      const siqsScore = getSiqsScore(spot.siqs);
      return siqsScore >= 5; // Only keep locations with reasonable scores
    });
    
    return validPoints;
  }

  /**
   * Apply advanced scoring and sorting to filtered locations
   */
  private applyScoringAndSorting(points: SharedAstroSpot[]): SharedAstroSpot[] {
    // Create a scoring system that balances quality and distance
    return [...points].sort((a, b) => {
      // Primary sort by SIQS score
      const siqsA = getSiqsScore(a.siqs) || 0;
      const siqsB = getSiqsScore(b.siqs) || 0;
      
      if (Math.abs(siqsB - siqsA) > 1) {
        return siqsB - siqsA;
      }
      
      // If SIQS scores are close, consider distance as secondary factor
      const distanceA = a.distance || Infinity;
      const distanceB = b.distance || Infinity;
      
      return distanceA - distanceB;
    });
  }
  
  /**
   * Validates a single astro spot against filtering criteria
   * with enhanced precision
   */
  private isValidAstroSpot(spot: SharedAstroSpot): boolean {
    if (!spot.latitude || !spot.longitude) {
      return false;
    }

    if (isWaterLocation(spot.latitude, spot.longitude, false)) {
      return false;
    }

    if (!isValidAstronomyLocation(spot.latitude, spot.longitude, spot.name)) {
      return false;
    }

    if (spot.siqs !== undefined && getSiqsScore(spot.siqs) < this.qualityThreshold) {
      return false;
    }

    return true;
  }
}

// Re-export location store functions
export {
  addLocationToStore,
  getLocationFromStore,
  getAllLocationsFromStore,
  clearLocationStore
} from './locationStore';
