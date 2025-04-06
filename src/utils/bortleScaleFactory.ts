/**
 * Enhanced Bortle scale algorithm that combines multiple data sources
 * for the most scientifically accurate results
 */

import { detectTerrainType, getTerrainAdjustmentFactor } from "./terrainData";
import { findNearbyUserBortleMeasurement } from "@/lib/api/pollution";
import { estimateBortleScaleByLocation } from "./locationUtils";

// Define confidence sources in order of accuracy
type ConfidenceSource = 
  | 'user-measurement'     // User-provided SQM measurement (highest confidence)
  | 'user-observation'     // User visual observation
  | 'star-count'           // Calculated from star counts
  | 'city-database'        // From known city database
  | 'terrain-corrected'    // Applied terrain correction to database value
  | 'rural-database'       // From rural area database
  | 'interpolated'         // Interpolated from nearby points
  | 'name-estimated'       // Estimated by location name
  | 'unknown';             // Default/fallback

/**
 * Get Bortle scale with all available correction factors
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param locationName Optional location name for name-based estimation
 * @returns Promise resolving to Bortle scale value and metadata
 */
export async function getEnhancedBortleScale(
  latitude: number,
  longitude: number,
  locationName?: string
): Promise<{
  bortleScale: number;
  confidenceSource: ConfidenceSource;
  terrainAdjusted: boolean;
  elevationAdjusted: boolean;
  elevation?: number;
  terrainType?: string;
}> {
  try {
    // Check inputs
    if (!isFinite(latitude) || !isFinite(longitude)) {
      return {
        bortleScale: 4, // Default value
        confidenceSource: 'unknown',
        terrainAdjusted: false,
        elevationAdjusted: false
      };
    }
    
    // First check for user-provided measurements (highest accuracy)
    const userMeasurement = findNearbyUserBortleMeasurement(latitude, longitude, 10);
    if (userMeasurement) {
      console.log(`Using user-provided Bortle scale: ${userMeasurement.bortleScale} (${userMeasurement.method})`);
      
      return {
        bortleScale: userMeasurement.bortleScale,
        confidenceSource: userMeasurement.method === 'measurement' 
          ? 'user-measurement'
          : 'user-observation',
        terrainAdjusted: false,
        elevationAdjusted: false
      };
    }
    
    // TODO: Add star count analysis here when available
    
    // Get terrain data for adjustments
    const elevation = await getTerrainElevation(latitude, longitude);
    const terrainType = await detectTerrainType(latitude, longitude);
    
    // Import database functions dynamically to avoid circular dependencies
    const { findClosestLocation } = await import("@/data/locationDatabase");
    const closestLocation = findClosestLocation(latitude, longitude);
    
    // If we have a known location from database with close match
    if (closestLocation && typeof closestLocation.bortleScale === 'number' && 
        closestLocation.bortleScale >= 1 && closestLocation.bortleScale <= 9 && 
        closestLocation.distance < 50) {
      
      console.log(`Using database Bortle scale: ${closestLocation.bortleScale} for ${closestLocation.name}`);
      
      // Apply terrain and elevation adjustments
      if (elevation && terrainType) {
        const terrainAdjustment = getTerrainAdjustmentFactor(terrainType, elevation);
        const adjustedBortleScale = Math.max(1, Math.min(9, closestLocation.bortleScale + terrainAdjustment));
        
        console.log(`Applied terrain adjustment ${terrainAdjustment} to Bortle scale, result: ${adjustedBortleScale}`);
        
        return {
          bortleScale: adjustedBortleScale,
          confidenceSource: 'terrain-corrected',
          terrainAdjusted: true,
          elevationAdjusted: true,
          elevation,
          terrainType
        };
      }
      
      return {
        bortleScale: closestLocation.bortleScale,
        confidenceSource: 'city-database',
        terrainAdjusted: false,
        elevationAdjusted: false
      };
    }
    
    // Try light pollution API
    try {
      const { fetchLightPollutionData } = await import("@/lib/api/pollution");
      const lightPollutionData = await fetchLightPollutionData(latitude, longitude);
      
      if (lightPollutionData?.bortleScale !== null && 
          typeof lightPollutionData.bortleScale === 'number' && 
          lightPollutionData.bortleScale >= 1 && 
          lightPollutionData.bortleScale <= 9) {
        
        // Already terrain-adjusted in the pollution module
        return {
          bortleScale: lightPollutionData.bortleScale,
          confidenceSource: 'terrain-corrected',
          terrainAdjusted: true,
          elevationAdjusted: true,
          elevation,
          terrainType: terrainType as string
        };
      }
    } catch (error) {
      console.warn("Error fetching light pollution data:", error);
    }
    
    // Try interpolation from nearby known points
    try {
      const { interpolateBortleScale } = await import("@/utils/lightPollutionData");
      const interpolatedScale = await interpolateBortleScale(latitude, longitude);
      
      if (interpolatedScale !== null) {
        // Apply terrain correction to interpolated scale
        if (elevation && terrainType) {
          const terrainAdjustment = getTerrainAdjustmentFactor(terrainType, elevation);
          const adjustedBortleScale = Math.max(1, Math.min(9, interpolatedScale + terrainAdjustment));
          
          return {
            bortleScale: adjustedBortleScale,
            confidenceSource: 'terrain-corrected',
            terrainAdjusted: true,
            elevationAdjusted: true,
            elevation,
            terrainType: terrainType as string
          };
        }
        
        return {
          bortleScale: interpolatedScale,
          confidenceSource: 'interpolated',
          terrainAdjusted: false,
          elevationAdjusted: false
        };
      }
    } catch (error) {
      console.warn("Error in Bortle scale interpolation:", error);
    }
    
    // Fall back to location name estimate as last resort
    if (locationName) {
      const nameEstimate = estimateBortleScaleByLocation(locationName, latitude, longitude);
      
      // Apply terrain correction to name estimate if available
      if (elevation && terrainType) {
        const terrainAdjustment = getTerrainAdjustmentFactor(terrainType, elevation);
        const adjustedBortleScale = Math.max(1, Math.min(9, nameEstimate + terrainAdjustment));
        
        return {
          bortleScale: adjustedBortleScale,
          confidenceSource: 'name-estimated',
          terrainAdjusted: true,
          elevationAdjusted: true,
          elevation,
          terrainType: terrainType as string
        };
      }
      
      return {
        bortleScale: nameEstimate,
        confidenceSource: 'name-estimated',
        terrainAdjusted: false,
        elevationAdjusted: false
      };
    }
    
    // Ultimate fallback
    return {
      bortleScale: 4,
      confidenceSource: 'unknown',
      terrainAdjusted: false,
      elevationAdjusted: false
    };
  } catch (error) {
    console.error("Error in enhanced Bortle scale calculation:", error);
    return {
      bortleScale: 4,
      confidenceSource: 'unknown',
      terrainAdjusted: false,
      elevationAdjusted: false
    };
  }
}

/**
 * Convert Bortle scale to SQM (Sky Quality Meter) reading
 * @param bortleScale Bortle scale value (1-9)
 * @returns SQM value (magnitudes per square arcsecond)
 */
export function bortleToSQM(bortleScale: number): number {
  // Validate input
  if (!isFinite(bortleScale)) return 21.0;
  
  // Ensure scale is in valid range
  const validScale = Math.max(1, Math.min(9, bortleScale));
  
  // Enhanced conversion formula based on observational data
  if (validScale === 1) return 22.0;
  if (validScale <= 2) return 21.8 - (validScale - 1) * 0.4;
  if (validScale <= 3) return 21.4 - (validScale - 2) * 0.5;
  if (validScale <= 4) return 20.9 - (validScale - 3) * 0.7;
  if (validScale <= 5) return 20.2 - (validScale - 4) * 0.6;
  if (validScale <= 6) return 19.6 - (validScale - 5) * 0.9;
  if (validScale <= 7) return 18.7 - (validScale - 6) * 1.0;
  if (validScale <= 8) return 17.7 - (validScale - 7) * 1.2;
  
  return 16.5; // Bortle 9
}

/**
 * Convert SQM value to Bortle scale approximation
 * @param sqm SQM value (magnitudes per square arcsecond)
 * @returns Approximate Bortle scale
 */
export function sqmToBortle(sqm: number): number {
  // Validate input
  if (!isFinite(sqm)) return 4;
  
  // Enhanced conversion based on the latest research
  if (sqm >= 22.0) return 1.0;
  if (sqm >= 21.5) return 1.0 + (22.0 - sqm) * 2.0;
  if (sqm >= 21.0) return 2.0 + (21.5 - sqm) * 2.0;
  if (sqm >= 20.2) return 3.0 + (21.0 - sqm) * 1.25;
  if (sqm >= 19.5) return 4.0 + (20.2 - sqm) * 1.43;
  if (sqm >= 18.5) return 5.0 + (19.5 - sqm) * 0.9;
  if (sqm >= 17.5) return 6.0 + (18.5 - sqm) * 0.8;
  if (sqm >= 16.5) return 7.0 + (17.5 - sqm) * 1.0;
  
  return 8.0 + Math.min(1.0, (16.5 - sqm) * 0.8);
}
