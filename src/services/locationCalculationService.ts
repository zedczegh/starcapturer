
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/data/utils/distanceCalculator";

// Maximum number of calculated locations to return
const MAX_CALCULATED_LOCATIONS = 200;

// Sample calculation points for when database is unavailable
const fallbackCalculationPoints: SharedAstroSpot[] = [
  {
    id: "calc-1",
    name: "Mountain Observation Point",
    latitude: 40.2,
    longitude: -105.5,
    bortleScale: 3,
    timestamp: new Date().toISOString()
  },
  {
    id: "calc-2",
    name: "Desert Observation Site",
    latitude: 36.1,
    longitude: -115.2,
    bortleScale: 2,
    timestamp: new Date().toISOString()
  }
];

/**
 * Get calculation points from the system
 * With fallback to ensure functionality
 */
export const getCalculationPoints = async (): Promise<SharedAstroSpot[]> => {
  try {
    // In a real implementation, this would fetch from a database
    // For now, return the fallback points
    return Promise.resolve(fallbackCalculationPoints);
  } catch (error) {
    console.error("Error fetching calculation points:", error);
    return fallbackCalculationPoints;
  }
};

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
    // Get calculation points
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
    
    // Add placeholder location details
    const enhancedLocations = locationsWithDistance.map(loc => ({
      ...loc,
      county: loc.county || "Sample County",
      state: loc.state || "Sample State",
      country: loc.country || "Sample Country"
    }));
    
    return enhancedLocations.slice(0, MAX_CALCULATED_LOCATIONS);
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
  
  // For now, we'll use the pre-calculated points
  return getCalculationPoints();
};
