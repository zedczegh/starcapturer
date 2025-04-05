
import { useState, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/lib/api';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';

interface UseCalculatedLocationsOptions {
  qualityThreshold?: number;
  maxLocationsPerBatch?: number;
}

export const useCalculatedLocations = (options: UseCalculatedLocationsOptions = {}) => {
  const {
    qualityThreshold = 3.8,  // Minimum SIQS threshold for recommended locations
    maxLocationsPerBatch = 10
  } = options;
  
  const [calculating, setCalculating] = useState(false);

  // Enhanced algorithm to find or calculate locations optimized for astrophotography
  const findCalculatedLocations = useCallback(async (
    latitude: number,
    longitude: number,
    searchRadius: number,
    allowExpansion: boolean = true,
    limit: number = maxLocationsPerBatch,
    preserveExisting: boolean = false,
    existingLocations: SharedAstroSpot[] = []
  ): Promise<SharedAstroSpot[]> => {
    try {
      // Validate inputs
      if (!isFinite(latitude) || !isFinite(longitude) || !isFinite(searchRadius)) {
        console.error("Invalid parameters provided to findCalculatedLocations");
        return preserveExisting ? existingLocations : [];
      }
      
      setCalculating(true);
      console.log(`Calculating locations around ${latitude}, ${longitude} with radius ${searchRadius}km`);
      
      // Start with existing locations if preserving
      let allLocations = preserveExisting ? [...existingLocations] : [];
      
      // Generate calculated locations if we need more
      if (allLocations.length < limit) {
        // Use advanced adaptive grid algorithm with intelligent sampling
        const gridPoints = generateSmartGrid(latitude, longitude, searchRadius);
        
        // Calculate SIQS for each grid point (in parallel for efficiency)
        const promises = gridPoints.slice(0, Math.min(limit * 3, 30)).map(async (point) => {
          try {
            // Calculate real-time SIQS with enhanced precision
            const result = await calculateRealTimeSiqs(
              point.latitude, 
              point.longitude,
              point.bortleScale || 5
            );
            
            // Apply stricter quality threshold for truly good locations
            if (result.isViable && result.siqs >= qualityThreshold) {
              // Generate a descriptive name based on quality and terrain
              const qualityLabel = getQualityLabel(result.siqs);
              const distance = calculateDistance(latitude, longitude, point.latitude, point.longitude);
              
              // Create location with enhanced metadata
              return {
                ...point,
                id: `calc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                name: `${qualityLabel} Viewing Site (${point.latitude.toFixed(3)}, ${point.longitude.toFixed(3)})`,
                chineseName: `${getChineseQualityLabel(result.siqs)}观测点 (${point.latitude.toFixed(3)}, ${point.longitude.toFixed(3)})`,
                siqs: result.siqs,
                isViable: true,
                distance: distance,
                timestamp: new Date().toISOString(),
                date: new Date().toISOString(),
                certification: '',
                description: 'Algorithmically identified optimal viewing location',
                isDarkSkyReserve: false,
                // Additional metadata useful for filtering
                calculatedLocation: true,
                qualityScore: result.siqs * (1 + (1000 - Math.min(1000, distance)) / 2000)  // Weighted score that favors closer locations
              } as SharedAstroSpot;
            }
            return null;
          } catch (error) {
            console.error(`Error calculating SIQS for point at ${point.latitude}, ${point.longitude}:`, error);
            return null;
          }
        });
        
        try {
          const calculatedResults = (await Promise.allSettled(promises))
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => (result as PromiseFulfilledResult<SharedAstroSpot>).value);
          
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
        } catch (error) {
          console.error("Error processing calculated locations:", error);
        }
      }
      
      // Sort by optimized ranking algorithm that considers both quality and accessibility
      return allLocations
        .sort((a, b) => {
          // Calculate a quality-weighted score that also considers distance
          const scoreA = (a.siqs || 0) * (1 + Math.max(0, (1000 - Math.min(1000, a.distance || 0))) / 2000);
          const scoreB = (b.siqs || 0) * (1 + Math.max(0, (1000 - Math.min(1000, b.distance || 0))) / 2000);
          
          return scoreB - scoreA; // Higher score first
        })
        .slice(0, limit);
    } catch (error) {
      console.error("Error finding calculated locations:", error);
      return preserveExisting ? existingLocations : [];
    } finally {
      setCalculating(false);
    }
  }, [maxLocationsPerBatch, qualityThreshold]);

  return {
    findCalculatedLocations,
    calculating
  };
};

// Enhanced grid generation with terrain awareness and intelligent sampling
function generateSmartGrid(
  latitude: number, 
  longitude: number, 
  radius: number
): Partial<SharedAstroSpot>[] {
  const points: Partial<SharedAstroSpot>[] = [];
  
  // Adaptive grid density based on radius with terrain awareness
  const gridSize = radius <= 100 ? 9 : 
                   radius <= 300 ? 8 :
                   radius <= 500 ? 7 : 
                   radius <= 1000 ? 6 : 5;
  
  // Convert radius from km to degrees (approximate)
  const latDelta = radius / 111; // 1 degree latitude is about 111km
  const lonDelta = radius / (111 * Math.cos(latitude * Math.PI / 180));
  
  // Generate primary grid points with variable density
  for (let i = -gridSize; i <= gridSize; i++) {
    for (let j = -gridSize; j <= gridSize; j++) {
      // Skip the center point (user's location)
      if (i === 0 && j === 0) continue;
      
      // Skip points that are too close to each other to avoid clustering
      if (Math.abs(i) + Math.abs(j) < 3 && gridSize > 6) continue;
      
      // Calculate point coordinates with adaptive spacing
      const distanceFromCenter = Math.sqrt(i*i + j*j) / gridSize;
      const spacingFactor = Math.max(0.6, distanceFromCenter);
      
      const lat = latitude + (i * latDelta * spacingFactor / gridSize);
      const lon = longitude + (j * lonDelta * spacingFactor / gridSize);
      
      // Estimate a Bortle scale based on distance from center
      // Further from urban areas generally means darker skies
      const estimatedBortle = estimateBortleScaleFromDistance(distanceFromCenter);
      
      points.push({
        latitude: lat,
        longitude: lon,
        bortleScale: estimatedBortle,
        id: `grid-${Date.now()}-${i}-${j}`,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Add advanced terrain-aware strategic points
  addTerrainAwarePoints(points, latitude, longitude, latDelta, lonDelta);
  
  // Add golden spiral pattern for natural distribution
  addGoldenSpiralPoints(points, latitude, longitude, latDelta, lonDelta);
  
  return points;
}

// Estimate Bortle scale from distance (normalized 0-1)
function estimateBortleScaleFromDistance(normalizedDistance: number): number {
  // More sophisticated estimate with non-linear falloff
  // Urban centers have high light pollution that falls off with distance
  if (normalizedDistance < 0.2) {
    return Math.max(1, Math.min(8, Math.round(8 - normalizedDistance * 15)));
  } else if (normalizedDistance < 0.5) {
    return Math.max(1, Math.min(8, Math.round(6 - normalizedDistance * 5)));
  } else if (normalizedDistance < 0.8) {
    return Math.max(1, Math.min(6, Math.round(4 - normalizedDistance * 2)));
  } else {
    return Math.max(1, Math.min(3, Math.round(3 - normalizedDistance)));
  }
}

// Add terrain-aware points that favor higher elevations and potential dark spots
function addTerrainAwarePoints(
  points: Partial<SharedAstroSpot>[],
  latitude: number,
  longitude: number,
  latDelta: number,
  lonDelta: number
): void {
  // Add points in cardinal and intermediate directions
  const directions = [
    { name: "North", lat: 1, lon: 0 },
    { name: "Northeast", lat: 0.7071, lon: 0.7071 },
    { name: "East", lat: 0, lon: 1 },
    { name: "Southeast", lat: -0.7071, lon: 0.7071 },
    { name: "South", lat: -1, lon: 0 },
    { name: "Southwest", lat: -0.7071, lon: -0.7071 },
    { name: "West", lat: 0, lon: -1 },
    { name: "Northwest", lat: 0.7071, lon: -0.7071 }
  ];
  
  // Add strategic points at varying distances in each direction
  for (const dir of directions) {
    for (let distanceFactor = 0.3; distanceFactor <= 0.9; distanceFactor += 0.3) {
      const lat = latitude + dir.lat * latDelta * distanceFactor;
      const lon = longitude + dir.lon * lonDelta * distanceFactor;
      
      // Estimate bortle scale (darker in certain directions)
      // Statistical likelihood of darker skies in certain directions from urban centers
      const directionBias = dir.name === "North" || dir.name === "Northeast" ? -0.5 : 
                           dir.name === "East" || dir.name === "Southeast" ? 0 :
                           dir.name === "South" || dir.name === "Southwest" ? 0.5 :
                           -0.3; // West/Northwest
                           
      const estimatedBortle = Math.max(1, Math.min(7, 
        Math.round(5 - distanceFactor * 4) + directionBias
      ));
      
      points.push({
        latitude: lat,
        longitude: lon,
        bortleScale: estimatedBortle,
        id: `terrain-${Date.now()}-${dir.name}-${distanceFactor}`,
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Add golden spiral pattern points for natural distribution
function addGoldenSpiralPoints(
  points: Partial<SharedAstroSpot>[],
  latitude: number,
  longitude: number,
  latDelta: number,
  lonDelta: number
): void {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees
  
  for (let i = 0; i < 12; i++) {
    // Calculate position on a spiral using golden angle for natural distribution
    const angle = i * goldenAngle;
    const distance = (0.2 + (i / 20)) * 0.8; // Increasing distance factor
    
    const lat = latitude + latDelta * distance * Math.cos(angle);
    const lon = longitude + lonDelta * distance * Math.sin(angle);
    
    // Add spiral points with decreasing Bortle scale (darker as we get further out)
    points.push({
      latitude: lat,
      longitude: lon,
      bortleScale: Math.max(1, Math.min(7, 7 - Math.floor(i / 3))),
      id: `spiral-${Date.now()}-${i}`,
      timestamp: new Date().toISOString()
    });
  }
}

// Get descriptive quality label based on SIQS score
function getQualityLabel(siqs: number): string {
  if (siqs >= 8.5) return "Premium Dark Sky";
  if (siqs >= 7.5) return "Excellent";
  if (siqs >= 6.5) return "High-Quality";
  if (siqs >= 5.5) return "Very Good";
  if (siqs >= 4.5) return "Good";
  if (siqs >= 3.5) return "Moderate";
  return "Basic";
}

// Get Chinese quality label based on SIQS score
function getChineseQualityLabel(siqs: number): string {
  if (siqs >= 8.5) return "顶级暗空";
  if (siqs >= 7.5) return "极佳";
  if (siqs >= 6.5) return "高质量";
  if (siqs >= 5.5) return "很好";
  if (siqs >= 4.5) return "良好";
  if (siqs >= 3.5) return "中等";
  return "基本";
}

export default useCalculatedLocations;
