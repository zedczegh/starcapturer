
import { isWaterLocation } from '@/utils/locationWaterCheck';
import { calculateDistance } from '@/utils/geoUtils';
import { toast } from 'sonner';
import { BatchLocationData } from '../types/forecastTypes';

/**
 * Validates if a location is suitable for astronomical observations
 * Checks for water locations, proximity to existing locations, etc.
 */
export class LocationValidator {
  private static readonly MIN_DISTANCE_BETWEEN_POINTS = 0.5; // in km
  
  /**
   * Check if a location is valid for astronomical observations
   * @param location The location to validate
   * @returns A validated location with additional properties
   */
  static async validateLocation(location: BatchLocationData): Promise<BatchLocationData> {
    console.log(`Validating location at ${location.latitude}, ${location.longitude}`);
    
    // Check if this is a water location
    let isWater = false;
    try {
      isWater = await isWaterLocation(location.latitude, location.longitude);
    } catch (error) {
      console.error("Error checking water location:", error);
      // Continue with validation, assuming it's not water in case of error
    }
    
    // Create a validated location object with additional properties
    const validatedLocation: BatchLocationData = {
      ...location,
      isValidated: true,
      isWater
    };
    
    if (isWater) {
      console.log(`Location at ${location.latitude}, ${location.longitude} is in water`);
    }
    
    return validatedLocation;
  }
  
  /**
   * Validate multiple locations in batch
   * @param locations Array of locations to validate
   * @returns Array of validated locations
   */
  static async validateBatchLocations(locations: BatchLocationData[]): Promise<BatchLocationData[]> {
    const validatedLocations: BatchLocationData[] = [];
    const invalidLocations: BatchLocationData[] = [];
    
    // Process each location
    for (const location of locations) {
      try {
        const validatedLocation = await this.validateLocation(location);
        
        // Don't add water locations
        if (validatedLocation.isWater) {
          invalidLocations.push(validatedLocation);
        } else {
          // Check if this location is too close to any previously validated location
          const isTooClose = validatedLocations.some(prevLoc => {
            const distance = calculateDistance(
              prevLoc.latitude, prevLoc.longitude, 
              validatedLocation.latitude, validatedLocation.longitude
            );
            return distance < this.MIN_DISTANCE_BETWEEN_POINTS;
          });
          
          if (isTooClose) {
            invalidLocations.push(validatedLocation);
          } else {
            validatedLocations.push(validatedLocation);
          }
        }
      } catch (error) {
        console.error(`Error validating location: ${location.name || 'unnamed'}`, error);
      }
    }
    
    if (invalidLocations.length > 0) {
      const waterCount = invalidLocations.filter(loc => loc.isWater).length;
      
      if (waterCount > 0) {
        toast.warning(`Skipped ${waterCount} water locations`);
      }
      
      const tooCloseCount = invalidLocations.length - waterCount;
      if (tooCloseCount > 0) {
        toast.info(`Skipped ${tooCloseCount} locations that were too close to others`);
      }
    }
    
    return validatedLocations;
  }
}
