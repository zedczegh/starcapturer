
/**
 * Optimized Location Finder Hook
 * Enhanced algorithm for finding ideal stargazing and astrophotography locations
 * with improved performance and accuracy
 */
import { useState, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/lib/api';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';
import { getBortleBasedSIQS } from '@/utils/darkSkyMeterUtils';

// Quality labels based on SIQS score
const getQualityLabel = (siqs: number): string => {
  if (siqs >= 8.5) return "Premium Dark Sky";
  if (siqs >= 7.5) return "Excellent";
  if (siqs >= 6.5) return "High-Quality";
  if (siqs >= 5.5) return "Very Good";
  if (siqs >= 4.5) return "Good";
  if (siqs >= 3.5) return "Moderate";
  return "Basic";
};

// Chinese quality labels
const getChineseQualityLabel = (siqs: number): string => {
  if (siqs >= 8.5) return "顶级暗空";
  if (siqs >= 7.5) return "极佳";
  if (siqs >= 6.5) return "高质量";
  if (siqs >= 5.5) return "很好";
  if (siqs >= 4.5) return "良好";
  if (siqs >= 3.5) return "中等";
  return "基本";
};

export const useOptimizedLocationFinder = () => {
  const [calculating, setCalculating] = useState(false);

  /**
   * Generate high-quality strategic sampling points optimized for finding dark sky locations
   */
  const generateStrategicPoints = useCallback((
    latitude: number, 
    longitude: number, 
    radius: number
  ): Array<{
    latitude: number;
    longitude: number;
    bortleScale: number;
    priority: number;
    id: string;
  }> => {
    const points: Array<{
      latitude: number;
      longitude: number;
      bortleScale: number;
      priority: number;
      id: string;
    }> = [];
    
    // Convert radius from km to degrees (approximate)
    const latDelta = radius / 111; // 1 degree latitude is about 111km
    const lonDelta = radius / (111 * Math.cos(latitude * Math.PI / 180));
    
    // Strategy 1: Move away from population centers (adaptive grid)
    // More points in the outskirts where dark skies are more likely
    
    // Calculate adaptive grid density based on radius
    const gridSize = radius <= 50 ? 10 : 
                     radius <= 100 ? 8 : 
                     radius <= 300 ? 6 :
                     radius <= 500 ? 5 : 4;
    
    // Generate strategic grid with preference for rural/natural areas
    for (let i = -gridSize; i <= gridSize; i += 1) {
      for (let j = -gridSize; j <= gridSize; j += 1) {
        // Skip the center point (user's location) and adjacent points
        if (Math.abs(i) < 2 && Math.abs(j) < 2) continue;
        
        // Calculate distance from center to prioritize farther points
        const distanceFromCenter = Math.sqrt(i*i + j*j) / gridSize;
        
        // Points farther from center should be spaced more widely
        // but we want more points at moderate distances
        let spacingFactor: number;
        if (distanceFromCenter < 0.4) {
          spacingFactor = 0.5 + distanceFromCenter * 0.75; // Closer spacing near center
        } else if (distanceFromCenter < 0.7) {
          spacingFactor = 0.8; // Ideal range for dark sky sites - denser sampling
        } else {
          spacingFactor = 0.8 + (distanceFromCenter - 0.7) * 1.5; // Wider spacing far away
        }
        
        // Adjust spacing for radius
        const radiusAdjustedSpacing = radius <= 100 ? spacingFactor * 0.8 : spacingFactor;
        
        // Calculate point coordinates
        const lat = latitude + (i * latDelta * radiusAdjustedSpacing / gridSize);
        const lon = longitude + (j * lonDelta * radiusAdjustedSpacing / gridSize);
        
        // Estimate Bortle scale - darker with distance from center
        // Using inverse square relationship with distance to model light pollution
        // Min Bortle 1, max Bortle 8 (avoiding extremes)
        const estimatedBortle = Math.max(1, Math.min(8, 
          Math.round(5 - 4 * Math.pow(distanceFromCenter, 0.7))
        ));
        
        // Set priority - darker locations get higher priority
        // Distance is also factored in (prefer closer locations when quality is similar)
        const priority = (10 - estimatedBortle) * 10 - (distanceFromCenter * 20);
        
        points.push({
          latitude: lat,
          longitude: lon,
          bortleScale: estimatedBortle,
          priority: priority,
          id: `strategic-${Date.now()}-${i}-${j}`
        });
      }
    }
    
    // Strategy 2: Natural terrain sampling using golden ratio spiral
    // This produces a more natural-looking distribution of points that avoids grid patterns
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees
    const numSpiralPoints = Math.min(30, Math.max(10, Math.floor(radius / 20)));
    
    for (let i = 0; i < numSpiralPoints; i++) {
      // Calculate distance factor (0 to 1)
      const distanceFactor = (i + 1) / numSpiralPoints;
      
      // Calculate angle using golden ratio for natural distribution
      const angle = i * goldenAngle;
      
      // Calculate distance - non-linear distribution favoring middle distances
      // This helps find the sweet spot between being too close to urban areas
      // and being too far away to be practical
      let distanceMultiplier: number;
      if (distanceFactor < 0.3) {
        // Initial points - moderately distant
        distanceMultiplier = 0.3 + distanceFactor * 0.7;
      } else if (distanceFactor < 0.7) {
        // Middle points - ideal distance for dark skies but still accessible
        distanceMultiplier = 0.51 + (distanceFactor - 0.3) * 0.3;
      } else {
        // Outer points - exploring further options
        distanceMultiplier = 0.63 + (distanceFactor - 0.7) * 0.37;
      }
      
      // Apply the multiplier to get actual distance in degree units
      const distance = distanceMultiplier * latDelta;
      
      // Convert polar to cartesian coordinates
      const lat = latitude + distance * Math.cos(angle);
      const lon = longitude + distance * Math.sin(angle) / Math.cos(latitude * Math.PI / 180);
      
      // Estimate Bortle scale based on distance
      // Darker skies further from urban center, modeled with inverse square law
      const estimatedBortle = Math.max(1, Math.min(8, 
        Math.round(8 - 7 * Math.pow(distanceMultiplier, 0.8))
      ));
      
      // Higher priority for darker skies
      const priority = (10 - estimatedBortle) * 15 - (distanceFactor * 30);
      
      points.push({
        latitude: lat,
        longitude: lon,
        bortleScale: estimatedBortle,
        priority: priority,
        id: `spiral-${Date.now()}-${i}`
      });
    }
    
    // Strategy 3: Elevation/terrain-aware sampling (simplified model)
    // In a real implementation, this would use elevation data
    // Here we use a simplified approach assuming higher elevations are generally darker
    
    // Add strategic points in compass directions with elevation bias
    const directions = [0, 45, 90, 135, 180, 225, 270, 315]; // 8 compass directions
    
    for (let i = 0; i < directions.length; i++) {
      const angle = directions[i] * (Math.PI / 180);
      
      // For each direction, try 3 different distances
      for (let distanceStep = 1; distanceStep <= 3; distanceStep++) {
        // Distance as proportion of max radius
        const distanceProp = distanceStep / 4; // 1/4, 2/4, 3/4 of max radius
        const distance = distanceProp * latDelta;
        
        // Calculate position
        const lat = latitude + distance * Math.cos(angle);
        const lon = longitude + distance * Math.sin(angle) / Math.cos(latitude * Math.PI / 180);
        
        // Elevation bias - eastern and northern directions assumed to have more elevation gain
        // This is a heuristic that would be replaced with actual elevation data
        let elevationBias = 0;
        if (angle >= 315 * (Math.PI / 180) || angle <= 135 * (Math.PI / 180)) {
          elevationBias = -1; // North to Southeast bias toward better Bortle
        }
        
        // Estimate Bortle scale based on distance and elevation bias
        const estimatedBortle = Math.max(1, Math.min(8, 
          Math.round(7 - 4 * distanceProp + elevationBias)
        ));
        
        // Prioritize darker locations
        const priority = (10 - estimatedBortle) * 12;
        
        points.push({
          latitude: lat,
          longitude: lon,
          bortleScale: estimatedBortle,
          priority: priority,
          id: `terrain-${Date.now()}-${i}-${distanceStep}`
        });
      }
    }
    
    // Sort points by priority and return
    return points.sort((a, b) => b.priority - a.priority);
  }, []);

  /**
   * Find calculated locations with enhanced algorithm
   */
  const findOptimizedLocations = useCallback(async (
    latitude: number,
    longitude: number,
    searchRadius: number,
    allowExpansion: boolean = true,
    limit: number = 10,
    preserveExisting: boolean = false,
    existingLocations: SharedAstroSpot[] = []
  ): Promise<SharedAstroSpot[]> => {
    try {
      // Validate inputs
      if (!isFinite(latitude) || !isFinite(longitude) || !isFinite(searchRadius)) {
        console.error("Invalid parameters provided to findOptimizedLocations");
        return preserveExisting ? existingLocations : [];
      }
      
      setCalculating(true);
      console.log(`Finding optimized locations around ${latitude}, ${longitude} with radius ${searchRadius}km`);
      
      // Start with existing locations if preserving
      let allLocations = preserveExisting ? [...existingLocations] : [];
      
      // Generate a set of existing coordinates to avoid duplication
      const existingCoords = new Set(allLocations.map(loc => 
        `${Math.floor(loc.latitude * 1000) / 1000},${Math.floor(loc.longitude * 1000) / 1000}`
      ));
      
      // Generate optimized sampling points
      if (allLocations.length < limit) {
        const strategicPoints = generateStrategicPoints(latitude, longitude, searchRadius);
        
        // Limit the number of points to evaluate based on limit and existing locations
        const numPointsToEvaluate = Math.min(
          strategicPoints.length,
          Math.max(15, limit * 3 - allLocations.length)
        );
        
        // Use a subset of points to avoid excessive API calls
        const pointsToEvaluate = strategicPoints.slice(0, numPointsToEvaluate);
        
        // Process points in batches to control API load
        const batchSize = 5;
        const batches = Math.ceil(pointsToEvaluate.length / batchSize);
        
        for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
          const batchStart = batchIndex * batchSize;
          const batchEnd = Math.min(batchStart + batchSize, pointsToEvaluate.length);
          const currentBatch = pointsToEvaluate.slice(batchStart, batchEnd);
          
          // Process batch in parallel
          const batchPromises = currentBatch.map(async (point) => {
            try {
              // Check for duplicate coordinates
              const coordKey = `${Math.floor(point.latitude * 1000) / 1000},${Math.floor(point.longitude * 1000) / 1000}`;
              if (existingCoords.has(coordKey)) {
                return null;
              }
              
              // Calculate real-time SIQS for this location
              // Use fast estimate for distant locations to limit API calls
              let siqs: number;
              let isViable: boolean;
              let factors: any[] | undefined;
              
              if (point.priority > 50) {
                // High priority point - do full API calculation
                const result = await calculateRealTimeSiqs(
                  point.latitude, 
                  point.longitude,
                  point.bortleScale
                );
                siqs = result.siqs;
                isViable = result.isViable;
                factors = result.factors;
              } else {
                // Low priority point - use fast estimation
                siqs = getBortleBasedSIQS(point.bortleScale);
                isViable = siqs >= 3.5;
              }
              
              // Skip if not viable for stargazing
              if (!isViable || siqs < 3.5) {
                return null;
              }
              
              // Add to existing coords to prevent duplicates
              existingCoords.add(coordKey);
              
              // Calculate distance from user location
              const distance = calculateDistance(
                latitude, longitude, 
                point.latitude, point.longitude
              );
              
              // Generate quality labels
              const qualityLabel = getQualityLabel(siqs);
              const chineseQualityLabel = getChineseQualityLabel(siqs);
              
              // Create location with enhanced metadata
              return {
                id: point.id,
                name: `${qualityLabel} Viewing Site (${point.latitude.toFixed(3)}, ${point.longitude.toFixed(3)})`,
                chineseName: `${chineseQualityLabel}观测点 (${point.latitude.toFixed(3)}, ${point.longitude.toFixed(3)})`,
                latitude: point.latitude,
                longitude: point.longitude,
                bortleScale: point.bortleScale,
                siqs: siqs,
                isViable: true,
                distance: distance,
                timestamp: new Date().toISOString(),
                date: new Date().toISOString(),
                certification: '',
                description: 'Algorithmically identified optimal viewing location',
                isDarkSkyReserve: false,
                siqsFactors: factors
              } as SharedAstroSpot;
            } catch (error) {
              console.error(`Error evaluating point at ${point.latitude}, ${point.longitude}:`, error);
              return null;
            }
          });
          
          try {
            const batchResults = (await Promise.allSettled(batchPromises))
              .filter(result => result.status === 'fulfilled' && result.value)
              .map(result => (result as PromiseFulfilledResult<SharedAstroSpot | null>).value)
              .filter(Boolean) as SharedAstroSpot[];
            
            // Add batch results to all locations
            allLocations = [...allLocations, ...batchResults];
            
            // If we have enough locations, break early
            if (allLocations.length >= limit * 1.5) {
              break;
            }
          } catch (error) {
            console.error("Error processing batch:", error);
          }
        }
      }
      
      // Final ranking and sorting
      return allLocations
        .sort((a, b) => {
          // Primary sort by SIQS (descending)
          const siqsDiff = (b.siqs || 0) - (a.siqs || 0);
          if (Math.abs(siqsDiff) > 0.5) return siqsDiff;
          
          // Secondary sort by distance (ascending) if SIQS is similar
          return (a.distance || 0) - (b.distance || 0);
        })
        .slice(0, limit);
    } catch (error) {
      console.error("Error finding optimized locations:", error);
      return preserveExisting ? existingLocations : [];
    } finally {
      setCalculating(false);
    }
  }, [generateStrategicPoints]);

  return {
    findOptimizedLocations,
    calculating
  };
};
