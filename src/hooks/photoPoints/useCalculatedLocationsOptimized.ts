
import { useState, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation } from '@/utils/locationValidator';
import { processPrioritizedBatchedSiqs } from '@/utils/siqsBatchProcessor';
import { calculateDistance } from '@/utils/locationUtils';

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
        const coordKey = `${point.lat.toFixed(4)},${point.lng.toFixed(4)}`;
        
        // Skip if already in our set
        if (existingCoords.has(coordKey)) {
          continue;
        }
        
        try {
          // Check if point is on water (skip if it is)
          const isWater = await isWaterLocation(point.lat, point.lng);
          if (isWater) {
            console.log(`Skipping water location at ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`);
            continue;
          }
          
          // Create a basic astro spot object
          const spot: SharedAstroSpot = {
            id: `calc-${point.lat.toFixed(4)}-${point.lng.toFixed(4)}`,
            name: `Spot at ${point.lat.toFixed(2)}, ${point.lng.toFixed(2)}`,
            latitude: point.lat,
            longitude: point.lng,
            distance: calculateDistance(centerLat, centerLng, point.lat, point.lng),
            bortleScale: 4,  // Will be updated by SIQS calculation
            timestamp: new Date().toISOString(),
            // Don't include isCalculated property (not in interface)
          };
          
          validPoints.push(spot);
          existingCoords.add(coordKey);
          pointsAdded++;
          
        } catch (error) {
          console.error(`Error processing point ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}:`, error);
        }
      }
      
      console.log(`Found ${validPoints.length} valid calculated locations`);
      
      // Run SIQS calculation for all valid points
      if (validPoints.length > 0) {
        try {
          const enhancedLocations = await processPrioritizedBatchedSiqs(validPoints);
          calculatedLocations = [...calculatedLocations, ...enhancedLocations];
        } catch (error) {
          console.error("Error processing batch SIQS:", error);
          calculatedLocations = [...calculatedLocations, ...validPoints];
        }
      }
      
      return calculatedLocations
        .sort((a, b) => (b.siqs || 0) - (a.siqs || 0))
        .slice(0, limit);
      
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
