
import { useState, useCallback, useEffect } from 'react';
import { isSiqsAtLeast } from '@/utils/siqsHelpers';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { haversineDistance } from '@/utils/haversine';
import { getBortleScale } from '@/services/bortleScaleService';
import { updateLocationsWithRealTimeSiqs } from '@/services/realTimeSiqsService';

/**
 * Hook for finding calculated star-gazing locations
 */
export function useCalculatedLocationsFind() {
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SharedAstroSpot[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [searchRadius, setSearchRadius] = useState(100); // km
  
  /**
   * Generate a grid of potential locations around a center point
   */
  const generateGridLocations = useCallback((
    centerLatitude: number, 
    centerLongitude: number,
    radius: number,
    density: number = 5
  ): SharedAstroSpot[] => {
    // Convert radius from km to approximate degrees
    const latDegrees = radius / 111;
    const lonDegrees = radius / (111 * Math.cos(centerLatitude * Math.PI / 180));
    
    const candidates: SharedAstroSpot[] = [];
    const steps = density; // Number of points in each direction
    
    for (let i = -steps; i <= steps; i++) {
      for (let j = -steps; j <= steps; j++) {
        // Skip center point
        if (i === 0 && j === 0) continue;
        
        // Create a grid of points
        const lat = centerLatitude + (i * latDegrees / steps);
        const lon = centerLongitude + (j * lonDegrees / steps);
        
        // Calculate distance to check if within radius
        const distance = haversineDistance(
          centerLatitude,
          centerLongitude,
          lat,
          lon
        );
        
        // Only include if within radius
        if (distance <= radius) {
          const location: SharedAstroSpot = {
            latitude: lat,
            longitude: lon,
            name: `Generated Location ${candidates.length + 1}`,
            distance
          };
          candidates.push(location);
        }
      }
    }
    
    return candidates;
  }, []);
  
  /**
   * Find interesting star-gazing locations near a given center
   */
  const findLocationsNear = useCallback(async (
    latitude: number,
    longitude: number,
    radius: number = 100,
    limit: number = 10
  ) => {
    if (!latitude || !longitude) {
      console.error("Invalid coordinates for location search");
      return [];
    }
    
    setIsLoading(true);
    setSearchRadius(radius);
    
    try {
      console.log(`Finding locations within ${radius}km of [${latitude}, ${longitude}]`);
      
      // Generate candidate locations in a grid
      const candidates = generateGridLocations(
        latitude,
        longitude,
        radius,
        Math.min(5, Math.max(3, Math.ceil(radius / 20)))
      );
      
      console.log(`Generated ${candidates.length} candidate locations`);
      
      // Get Bortle scales for candidate locations
      const withBortleScale = await Promise.all(candidates.map(async (loc) => {
        try {
          const bortleData = await getBortleScale(loc.latitude, loc.longitude);
          return {
            ...loc,
            bortleScale: bortleData?.value || 5, // Default to Bortle 5 if unavailable
            bortleSource: bortleData?.source || 'estimated'
          };
        } catch (e) {
          console.error("Error getting Bortle scale:", e);
          return {
            ...loc,
            bortleScale: 5, // Default fallback
            bortleSource: 'fallback'
          };
        }
      }));
      
      // Filter promising locations (good Bortle scale)
      const promisingLocations = withBortleScale.filter(
        loc => loc.bortleScale && loc.bortleScale < 6
      ).slice(0, limit * 2); // Take more than needed for SIQS filtering
      
      console.log(`Found ${promisingLocations.length} promising locations based on Bortle scale`);
      
      // Calculate SIQS for the most promising locations
      const updatedLocations = await updateLocationsWithRealTimeSiqs(promisingLocations);
      
      // Filter by SIQS score
      const goodLocations = updatedLocations.filter(
        loc => loc.siqs !== undefined && isSiqsAtLeast(loc.siqs, 4.0)
      );
      
      console.log(`Found ${goodLocations.length} locations with good SIQS score`);
      
      // Sort by SIQS score (highest first)
      const sortedLocations = goodLocations.sort(
        (a, b) => (b.siqs || 0) - (a.siqs || 0)
      );
      
      const finalLocations = sortedLocations.slice(0, limit);
      
      // Set results and update state
      setLocations(finalLocations);
      setResults(finalLocations);
      setHasMore(finalLocations.length < goodLocations.length);
      
      return finalLocations;
    } catch (error) {
      console.error("Error finding locations:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [generateGridLocations]);
  
  const loadMoreLocations = useCallback(() => {
    // Implementation would load more results from the full set of locations
    console.log("Load more locations requested");
    setHasMore(false); // For now just disable the load more button
  }, []);
  
  return {
    locations,
    results,
    isLoading,
    hasMore,
    searchRadius,
    findLocationsNear,
    loadMoreLocations,
    setSearchRadius
  };
}
