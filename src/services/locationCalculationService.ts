
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/data/utils/distanceCalculator";
import { getCalculationPoints } from "@/data/calculationPoints";

// Maximum number of calculated locations to return
const MAX_CALCULATED_LOCATIONS = 200;

/**
 * Find algorithmically calculated locations near a point
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @param expandSearch Whether to expand search if no results are found
 * @returns Array of calculated locations
 */
export const findCalculatedLocations = async (
  latitude: number,
  longitude: number,
  radius: number,
  expandSearch: boolean = true
): Promise<SharedAstroSpot[]> => {
  try {
    // Get calculation points from database
    const points = await getCalculationPoints();
    
    if (!points || points.length === 0) {
      console.error("No calculation points found");
      return [];
    }
    
    // Calculate distance for each point and filter by radius
    const locationsWithDistance = points.map(point => {
      const distance = calculateDistance(
        latitude,
        longitude,
        point.latitude,
        point.longitude
      );
      
      return {
        ...point,
        distance,
        timestamp: point.timestamp || new Date().toISOString()
      };
    }).filter(point => point.distance <= radius);
    
    // Sort by distance and limit to maximum locations
    locationsWithDistance.sort((a, b) => a.distance - b.distance);
    
    // If no results and expandSearch is true, try with a larger radius
    if (locationsWithDistance.length === 0 && expandSearch) {
      const expandedRadius = Math.min(radius * 1.5, 5000);
      return findCalculatedLocations(latitude, longitude, expandedRadius, false);
    }
    
    return locationsWithDistance.slice(0, MAX_CALCULATED_LOCATIONS);
  } catch (error) {
    console.error("Error finding calculated locations:", error);
    return [];
  }
};

/**
 * Generate calculation points on demand
 * This function creates points in areas likely to have good viewing conditions
 * based on light pollution data and terrain features
 */
export const generateCalculationPoints = async (
  centerLat: number,
  centerLng: number,
  radius: number
): Promise<SharedAstroSpot[]> => {
  // In a full implementation, this would analyze terrain data
  // and light pollution maps to generate optimal viewing locations
  
  // For now, we'll use the pre-calculated points from the database
  return getCalculationPoints();
};
