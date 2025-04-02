
import { useState, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation } from '@/utils/locationValidator';
import { processPrioritizedBatchedSiqs } from '@/utils/siqsBatchProcessor';

const MAX_CALCULATED_POINTS = 50;
const MIN_DISTANCE_BETWEEN_POINTS = 5; // km

/**
 * Enhanced hook for finding and optimizing calculated dark sky locations
 */
export function useCalculatedLocationsOptimized() {
  const [searchingCalculated, setSearchingCalculated] = useState(false);
  
  /**
   * Find calculated locations using grid-based and quality-filtered approach
   * @param centerLat Center latitude
   * @param centerLng Center longitude
   * @param radius Search radius in km
   * @param expandRadius Whether to expand radius if not enough points found
   * @param limit Maximum number of points to return
   * @param preserveExisting Whether to preserve existing locations when adding new ones
   * @param existingLocations Existing locations to preserve
   * @returns Promise resolving to array of calculated locations
   */
  const findCalculatedLocations = useCallback(async (
    centerLat: number,
    centerLng: number,
    radius: number,
    expandRadius: boolean = true,
    limit: number = 10,
    preserveExisting: boolean = false,
    existingLocations: SharedAstroSpot[] = []
  ): Promise<SharedAstroSpot[]> => {
    try {
      setSearchingCalculated(true);
      console.log(`Finding calculated locations around ${centerLat.toFixed(4)}, ${centerLng.toFixed(4)} with radius ${radius}km`);
      
      // Prepare to store unique locations
      let calculatedLocations: SharedAstroSpot[] = [];
      const existingCoords = new Set<string>();
      
      // Add existing locations to coordinate set to avoid duplicates
      if (preserveExisting && existingLocations.length > 0) {
        existingLocations.forEach(loc => {
          existingCoords.add(`${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`);
          calculatedLocations.push(loc);
        });
        console.log(`Preserving ${existingLocations.length} existing locations`);
      }
      
      // Use an adaptive grid size based on search radius
      const gridSize = Math.min(0.5, Math.max(0.1, radius / 100));
      
      // Determine grid extents (approximate km to lat/lng)
      const kmToLat = 1 / 110.574;
      const kmToLng = 1 / (111.32 * Math.cos(centerLat * Math.PI / 180));
      const latRadius = radius * kmToLat;
      const lngRadius = radius * kmToLng;
      
      // Create points in a hexagonal-like grid
      const gridPoints: {lat: number; lng: number}[] = [];
      const gridStepLat = gridSize;
      const gridStepLng = gridSize * 1.5;
      
      for (let latOffset = -latRadius; latOffset <= latRadius; latOffset += gridStepLat) {
        const row = Math.round(latOffset / gridStepLat);
        const staggeredRow = row % 2 === 0;
        
        for (let lngOffset = -lngRadius; lngOffset <= lngRadius; lngOffset += gridStepLng) {
          const adjustedLngOffset = staggeredRow ? lngOffset + gridStepLng / 2 : lngOffset;
          
          // Calculate actual lat/lng
          const lat = centerLat + latOffset;
          const lng = centerLng + adjustedLngOffset;
          
          // Check if this point is within radius
          const distance = calculateDistance(centerLat, centerLng, lat, lng);
          if (distance <= radius) {
            gridPoints.push({ lat, lng });
          }
        }
      }
      
      console.log(`Created ${gridPoints.length} potential grid points within ${radius}km`);
      
      // Filter points - remove water locations and add quality metrics
      const validPoints: SharedAstroSpot[] = [];
      
      let pointsAdded = 0;
      const maxPointsToCheck = MAX_CALCULATED_POINTS * 2;
      
      const prioritizedPoints = gridPoints
        // Ensure points aren't too close to each other
        .filter((point, idx) => {
          if (idx === 0) return true;
          
          // Check against all previous points
          for (let i = 0; i < idx; i++) {
            const prevPoint = gridPoints[i];
            const distance = calculateDistance(
              point.lat, point.lng, 
              prevPoint.lat, prevPoint.lng
            );
            
            if (distance < MIN_DISTANCE_BETWEEN_POINTS) {
              return false;
            }
          }
          
          return true;
        })
        // Sort by distance from center (prioritize closer points)
        .sort((a, b) => {
          const distA = calculateDistance(centerLat, centerLng, a.lat, a.lng);
          const distB = calculateDistance(centerLat, centerLng, b.lat, b.lng);
          return distA - distB;
        })
        // Limit to reasonable number of points to check
        .slice(0, maxPointsToCheck);
      
      console.log(`After filtering for minimum distance, have ${prioritizedPoints.length} points to evaluate`);
      
      // Process points in smaller batches for faster evaluation
      for (let i = 0; i < prioritizedPoints.length && pointsAdded < limit; i++) {
        const point = prioritizedPoints[i];
        
        // Skip if point is already in existing locations
        const coordKey = `${point.lat.toFixed(4)},${point.lng.toFixed(4)}`;
        if (existingCoords.has(coordKey)) {
          continue;
        }
        
        // Quick check for water/ocean location
        if (await isWaterLocation(point.lat, point.lng)) {
          continue;
        }
        
        // Calculate distance from center in km
        const distance = calculateDistance(centerLat, centerLng, point.lat, point.lng);
        
        // Estimate Bortle scale based on distance from civilization
        // This is just an initial estimate - real-time SIQS will calculate actual value
        let estimatedBortle = 4;
        if (distance > radius * 0.8) estimatedBortle = 3;
        if (distance > radius * 0.9) estimatedBortle = 2;
        
        // Create a new calculated location
        const newLocation: SharedAstroSpot = {
          id: `calc-${Date.now()}-${i}`,
          name: `Calculated Dark Sky Site ${pointsAdded + 1}`,
          latitude: point.lat,
          longitude: point.lng,
          bortleScale: estimatedBortle,
          // Start with estimated SIQS based on Bortle scale
          siqs: Math.max(0, 10 - estimatedBortle),
          distance: distance,
          isCalculated: true
        };
        
        validPoints.push(newLocation);
        existingCoords.add(coordKey);
        pointsAdded++;
      }
      
      // If we don't have enough points and expandRadius is true, expand and try again
      if (validPoints.length < limit * 0.5 && expandRadius && radius < 10000) {
        console.log(`Found only ${validPoints.length} valid points, expanding radius from ${radius}km to ${radius * 1.5}km`);
        
        // Recursively call with expanded radius
        const expandedPoints = await findCalculatedLocations(
          centerLat,
          centerLng,
          radius * 1.5,
          false, // Don't expand again
          limit,
          true, // Preserve what we found so far
          [...calculatedLocations, ...validPoints]
        );
        
        return expandedPoints;
      }
      
      // Combine existing and new calculated locations
      calculatedLocations = [...calculatedLocations, ...validPoints];
      
      // Process SIQS in batches
      const processedLocations = await processPrioritizedBatchedSiqs(calculatedLocations);
      
      console.log(`Returning ${processedLocations.length} calculated dark sky locations`);
      return processedLocations;
    } catch (error) {
      console.error("Error finding calculated locations:", error);
      return [];
    } finally {
      setSearchingCalculated(false);
    }
  }, []);
  
  return {
    findCalculatedLocations,
    searchingCalculated
  };
}

/**
 * Calculate distance between two points in km using Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
