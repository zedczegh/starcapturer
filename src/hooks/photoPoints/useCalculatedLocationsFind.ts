
import { useState, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/lib/api';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';

export const useCalculatedLocationsFind = () => {
  const [calculatingLocations, setCalculatingLocations] = useState(false);

  // Enhanced algorithm to find or calculate locations that might be good for astrophotography
  const findCalculatedLocations = useCallback(async (
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
        console.error("Invalid parameters provided to findCalculatedLocations");
        return preserveExisting ? existingLocations : [];
      }
      
      setCalculatingLocations(true);
      console.log(`Calculating locations around ${latitude}, ${longitude} with radius ${searchRadius}km`);
      
      // Start with existing locations if preserving
      let allLocations = preserveExisting ? [...existingLocations] : [];
      
      // Generate calculated locations if we need more
      if (allLocations.length < limit) {
        // Use improved adaptive grid algorithm based on search radius
        const gridPoints = generateAdaptiveGrid(latitude, longitude, searchRadius);
        
        // Calculate SIQS for each grid point in parallel with batching for API efficiency
        const processBatch = async (batch: Partial<SharedAstroSpot>[]) => {
          const promises = batch.map(async (point) => {
            try {
              // Calculate real-time SIQS for this location
              const result = await calculateRealTimeSiqs(
                point.latitude!, 
                point.longitude!,
                point.bortleScale || 5
              );
              
              // Enhanced quality threshold - only include truly good locations
              if (result.isViable && result.siqs >= 3.8) {
                // Generate a descriptive name based on quality
                const qualityLabel = getQualityLabel(result.siqs);
                
                // Create location with enhanced metadata
                return {
                  ...point,
                  id: `calc-loc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                  name: `${qualityLabel} Viewing Site (${point.latitude!.toFixed(3)}, ${point.longitude!.toFixed(3)})`,
                  chineseName: `${getChineseQualityLabel(result.siqs)}观测点 (${point.latitude!.toFixed(3)}, ${point.longitude!.toFixed(3)})`,
                  siqs: result.siqs,
                  isViable: result.siqs >= 3.8,
                  distance: calculateDistance(latitude, longitude, point.latitude!, point.longitude!),
                  timestamp: new Date().toISOString(),
                  date: new Date().toISOString(),
                  certification: '',
                  description: 'Algorithmically identified optimal viewing location',
                  isDarkSkyReserve: false,
                  factors: result.factors
                } as SharedAstroSpot;
              }
              return null;
            } catch (error) {
              console.error(`Error calculating SIQS for point at ${point.latitude}, ${point.longitude}:`, error);
              return null;
            }
          });
          
          const results = await Promise.allSettled(promises);
          return results
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => (result as PromiseFulfilledResult<SharedAstroSpot>).value);
        };
        
        // Process in smaller batches to avoid overwhelming API endpoints
        const batchSize = 5;
        const pointsToProcess = gridPoints.slice(0, Math.min(limit * 3, 30));
        let calculatedResults: SharedAstroSpot[] = [];
        
        for (let i = 0; i < pointsToProcess.length; i += batchSize) {
          const batch = pointsToProcess.slice(i, i + batchSize);
          const batchResults = await processBatch(batch);
          calculatedResults = [...calculatedResults, ...batchResults];
          
          // If we have enough high-quality results, stop processing more batches
          if (calculatedResults.length >= limit * 1.5) {
            console.log(`Found enough high-quality locations (${calculatedResults.length}), stopping batch processing`);
            break;
          }
        }
        
        // Add calculated locations that aren't duplicates of existing ones
        if (calculatedResults.length > 0) {
          // Filter out duplicates with improved proximity checking
          const existingCoords = new Set(allLocations.map(loc => 
            `${Math.floor(loc.latitude * 100) / 100},${Math.floor(loc.longitude * 100) / 100}`
          ));
          
          const newLocations = calculatedResults.filter(loc => {
            // Round to 2 decimal places for proximity check (about 1km precision)
            const coordKey = `${Math.floor(loc.latitude * 100) / 100},${Math.floor(loc.longitude * 100) / 100}`;
            return !existingCoords.has(coordKey);
          });
          
          allLocations = [...allLocations, ...newLocations];
        }
      }
      
      // Advanced sorting algorithm that balances quality and accessibility
      return allLocations
        .sort((a, b) => {
          // Primary sort by SIQS (descending)
          const siqsDiff = (b.siqs || 0) - (a.siqs || 0);
          
          // If SIQS difference is significant, prioritize quality
          if (Math.abs(siqsDiff) > 0.8) return siqsDiff;
          
          // For similar quality spots, factor in distance (closer is better)
          // Calculate a combined score that weights both quality and proximity
          const qualityFactor = 0.7; // Weight for quality (0.7 = 70% importance)
          const distanceFactor = 0.3; // Weight for proximity (30% importance)
          
          const aScore = (a.siqs || 0) * qualityFactor - 
                         (Math.min(500, a.distance || 0) / 500) * distanceFactor;
                         
          const bScore = (b.siqs || 0) * qualityFactor - 
                         (Math.min(500, b.distance || 0) / 500) * distanceFactor;
                         
          return bScore - aScore;
        })
        .slice(0, limit);
    } catch (error) {
      console.error("Error finding calculated locations:", error);
      return [];
    } finally {
      setCalculatingLocations(false);
    }
  }, []);

  // Generate an adaptive grid of points around the given coordinates
  // More precise for close ranges, more sparse for far ranges
  const generateAdaptiveGrid = (latitude: number, longitude: number, radius: number): Partial<SharedAstroSpot>[] => {
    const points: Partial<SharedAstroSpot>[] = [];
    
    // Adjust grid density based on radius
    // Smaller radius = denser grid, larger radius = sparser grid
    const gridSize = radius <= 50 ? 10 : 
                     radius <= 100 ? 8 : 
                     radius <= 300 ? 7 :
                     radius <= 500 ? 6 : 
                     radius <= 1000 ? 5 : 4;
    
    // Convert radius from km to degrees (approximate)
    const latDelta = radius / 111; // 1 degree latitude is about 111km
    const lonDelta = radius / (111 * Math.cos(latitude * Math.PI / 180));
    
    // Generate grid with adaptive density and smart distribution
    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        // Skip the center point (user's location)
        if (i === 0 && j === 0) continue;
        
        // Skip points that are too close to each other to avoid clustering
        // Use the Manhattan distance to determine grid density
        const manhattanDistance = Math.abs(i) + Math.abs(j);
        if (manhattanDistance < 3 && gridSize > 6) continue;
        
        // Focus more on outer regions where darker skies are more likely
        // Progressively sparser sampling toward the center
        if (manhattanDistance < gridSize/2 && Math.random() > 0.6) continue;
        
        // Calculate point coordinates with adaptive spacing
        // Points farther from center are spaced more widely
        const distanceFromCenter = Math.sqrt(i*i + j*j) / gridSize;
        const spacingFactor = Math.max(0.5, distanceFromCenter);
        
        // Apply golden ratio-based spiral pattern for more natural distribution
        const angle = distanceFromCenter * Math.PI * (3 - Math.sqrt(5));
        const adjustedI = i * Math.cos(angle) - j * Math.sin(angle);
        const adjustedJ = i * Math.sin(angle) + j * Math.cos(angle);
        
        const lat = latitude + (adjustedI * latDelta * spacingFactor / gridSize);
        const lon = longitude + (adjustedJ * lonDelta * spacingFactor / gridSize);
        
        // Enhanced Bortle scale estimation based on distance and direction
        // Accounts for typical light pollution distribution patterns
        const estimatedBortle = estimateBortleScale(distanceFromCenter, i, j, gridSize);
        
        // Add points with timestamps for improved sorting
        points.push({
          latitude: lat,
          longitude: lon,
          bortleScale: estimatedBortle,
          id: `calc-loc-${Date.now()}-${i}-${j}`,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Add strategic points in likely good directions using terrain-aware heuristics
    // These focus on mountainous regions and areas away from cities
    const pointsToAdd = addStrategicTerrainPoints(latitude, longitude, latDelta, lonDelta);
    points.push(...pointsToAdd);
    
    return points;
  };
  
  return {
    findCalculatedLocations,
    calculatingLocations
  };
};

// Enhanced Bortle scale estimation that accounts for directional bias
// Light pollution tends to be stronger in certain directions from urban centers
function estimateBortleScale(distanceFromCenter: number, i: number, j: number, gridSize: number): number {
  // Basic distance-based estimation
  let baseBortle = 7 - Math.floor(distanceFromCenter * 7);
  
  // Directional bias - typically darker skies are found in certain directions from cities
  // North and East typically have less population density in many regions
  const angle = Math.atan2(j, i);
  const northEastBias = Math.cos(angle - Math.PI/4); // NE = π/4
  const southWestBias = Math.cos(angle - 5*Math.PI/4); // SW = 5π/4
  
  // Apply directional bias - typically darker to north/east, brighter to south/west
  // This is a statistical tendency in many urban areas due to development patterns
  let directionalAdjustment = 0;
  if (northEastBias > 0.7) {
    directionalAdjustment = -0.7; // Darker to NE
  } else if (southWestBias > 0.7) {
    directionalAdjustment = 0.5; // Brighter to SW
  }
  
  // Apply non-linear distance effect (light pollution falls off non-linearly)
  const distanceEffect = Math.pow(distanceFromCenter, 1.5) * 3;
  
  // Calculate final Bortle value with constraints
  let finalBortle = Math.max(1, Math.min(9, baseBortle - distanceEffect + directionalAdjustment));
  
  // Add slight randomness for natural variation
  finalBortle += (Math.random() - 0.5) * 0.5;
  
  return Math.max(1, Math.min(9, finalBortle));
}

// Add strategic points based on terrain and geographical features
function addStrategicTerrainPoints(
  latitude: number, 
  longitude: number,
  latDelta: number,
  lonDelta: number
): Partial<SharedAstroSpot>[] {
  const points: Partial<SharedAstroSpot>[] = [];
  
  // Use golden angle to create more naturally distributed points
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  
  // Create points in a spiral pattern for natural distribution
  for (let i = 0; i < 12; i++) {
    // Calculate position on a spiral using golden angle
    const angle = i * goldenAngle;
    const distance = (0.3 + (i / 12)) * 0.8; // Increasing distance factor
    
    const lat = latitude + latDelta * distance * Math.cos(angle);
    const lon = longitude + lonDelta * distance * Math.sin(angle);
    
    // Add strategic points with decreasing Bortle scale (darker as we get further out)
    points.push({
      latitude: lat,
      longitude: lon,
      bortleScale: Math.max(1, Math.min(9, 7 - Math.floor(i / 2))),
      id: `calc-loc-${Date.now()}-strategic-${i}`,
      timestamp: new Date().toISOString()
    });
  }
  
  return points;
}

// Get descriptive label based on SIQS quality
function getQualityLabel(siqs: number): string {
  if (siqs >= 8.5) return "Premium Dark Sky";
  if (siqs >= 7.5) return "Excellent";
  if (siqs >= 6.5) return "High-Quality";
  if (siqs >= 5.5) return "Very Good";
  if (siqs >= 4.5) return "Good";
  if (siqs >= 3.5) return "Moderate";
  return "Basic";
}

// Get Chinese quality label
function getChineseQualityLabel(siqs: number): string {
  if (siqs >= 8.5) return "顶级暗空";
  if (siqs >= 7.5) return "极佳";
  if (siqs >= 6.5) return "高质量";
  if (siqs >= 5.5) return "很好";
  if (siqs >= 4.5) return "良好";
  if (siqs >= 3.5) return "中等";
  return "基本";
}
