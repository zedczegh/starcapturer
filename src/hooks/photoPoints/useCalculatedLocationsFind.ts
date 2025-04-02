
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
      setCalculatingLocations(true);
      console.log(`Calculating locations around ${latitude}, ${longitude} with radius ${searchRadius}km`);
      
      // Start with existing locations if preserving
      let allLocations = preserveExisting ? [...existingLocations] : [];
      
      // Generate calculated locations if we need more
      if (allLocations.length < limit) {
        // Use improved adaptive grid algorithm based on search radius
        const gridPoints = generateAdaptiveGrid(latitude, longitude, searchRadius);
        
        // Calculate SIQS for each grid point (in parallel for efficiency)
        const promises = gridPoints.slice(0, Math.min(limit * 3, 30)).map(async (point) => {
          try {
            // Calculate real-time SIQS for this location
            const result = await calculateRealTimeSiqs(
              point.latitude, 
              point.longitude,
              point.bortleScale || 5
            );
            
            // Enhanced quality threshold - only include truly good locations
            if (result.isViable && result.siqs >= 3.5) {
              // Generate a descriptive name based on quality
              const qualityLabel = getQualityLabel(result.siqs);
              
              // Create location with enhanced metadata
              return {
                ...point,
                id: `calc-loc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                name: `${qualityLabel} Viewing Site (${point.latitude.toFixed(3)}, ${point.longitude.toFixed(3)})`,
                chineseName: `${getChineseQualityLabel(result.siqs)}观测点 (${point.latitude.toFixed(3)}, ${point.longitude.toFixed(3)})`,
                siqs: result.siqs,
                isViable: result.siqs >= 3.5,
                distance: calculateDistance(latitude, longitude, point.latitude, point.longitude),
                timestamp: new Date().toISOString(),
                date: new Date().toISOString(),
                certification: '',
                description: 'Algorithmically identified optimal viewing location',
                isDarkSkyReserve: false
              } as SharedAstroSpot;
            }
            return null;
          } catch (error) {
            console.error(`Error calculating SIQS for point at ${point.latitude}, ${point.longitude}:`, error);
            return null;
          }
        });
        
        const calculatedResults = (await Promise.all(promises)).filter(Boolean) as SharedAstroSpot[];
        
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
      
      // Sort by quality (SIQS) first then distance as secondary sort
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
    const gridSize = radius <= 200 ? 8 : 
                    radius <= 500 ? 6 : 
                    radius <= 1000 ? 5 : 4;
    
    // Convert radius from km to degrees (approximate)
    const latDelta = radius / 111; // 1 degree latitude is about 111km
    const lonDelta = radius / (111 * Math.cos(latitude * Math.PI / 180));
    
    // Generate grid with variable density
    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        // Skip the center point (user's location)
        if (i === 0 && j === 0) continue;
        
        // Calculate point coordinates with adaptive spacing
        // Points farther from center are spaced more widely
        const distanceFromCenter = Math.sqrt(i*i + j*j) / gridSize;
        const spacingFactor = Math.max(0.5, distanceFromCenter);
        
        const lat = latitude + (i * latDelta * spacingFactor / gridSize);
        const lon = longitude + (j * lonDelta * spacingFactor / gridSize);
        
        // Estimate a Bortle scale based on distance from center
        // Further from urban areas generally means darker skies
        const estimatedBortle = Math.max(1, Math.min(8, Math.round(5 - 3 * distanceFromCenter)));
        
        points.push({
          latitude: lat,
          longitude: lon,
          bortleScale: estimatedBortle,
          id: `calc-loc-${Date.now()}-${i}-${j}`,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Add some additional strategic points in likely good directions
    // (Usually away from population centers and toward nature)
    const randomOffset = Math.random() * 0.2 - 0.1; // -0.1 to +0.1
    
    // North point (likely darker skies in Northern Hemisphere)
    points.push({
      latitude: latitude + (latDelta * 0.6),
      longitude: longitude + randomOffset,
      bortleScale: 3,
      id: `calc-loc-${Date.now()}-north`,
      timestamp: new Date().toISOString()
    });
    
    // Add a point toward mountains or wilderness if we can estimate a direction
    // (This is a simple approximation - in real app, use terrain data)
    points.push({
      latitude: latitude + (latDelta * 0.35),
      longitude: longitude + (lonDelta * 0.35),
      bortleScale: 2,
      id: `calc-loc-${Date.now()}-wilderness`,
      timestamp: new Date().toISOString()
    });
    
    return points;
  };

  // Get descriptive label based on SIQS quality
  const getQualityLabel = (siqs: number): string => {
    if (siqs >= 8.5) return "Premium Dark Sky";
    if (siqs >= 7.5) return "Excellent";
    if (siqs >= 6.5) return "High-Quality";
    if (siqs >= 5.5) return "Very Good";
    if (siqs >= 4.5) return "Good";
    if (siqs >= 3.5) return "Moderate";
    return "Basic";
  };
  
  // Get Chinese quality label
  const getChineseQualityLabel = (siqs: number): string => {
    if (siqs >= 8.5) return "顶级暗空";
    if (siqs >= 7.5) return "极佳";
    if (siqs >= 6.5) return "高质量";
    if (siqs >= 5.5) return "很好";
    if (siqs >= 4.5) return "良好";
    if (siqs >= 3.5) return "中等";
    return "基本";
  };

  return {
    findCalculatedLocations,
    calculatingLocations
  };
};
