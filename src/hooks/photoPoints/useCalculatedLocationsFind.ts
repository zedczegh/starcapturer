
import { useState, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/lib/api';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';

export const useCalculatedLocationsFind = () => {
  const [calculatingLocations, setCalculatingLocations] = useState(false);

  // Enhanced algorithm to find or calculate locations for astrophotography
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
        // Enhanced grid with more intelligent distribution
        // Calculate points in a grid around the user location with adaptive density
        const gridPoints = generateSmartGridPoints(latitude, longitude, searchRadius);
        
        // Calculate SIQS for each grid point (up to our limit)
        const promises = gridPoints.slice(0, limit * 3).map(async (point) => {
          try {
            // Calculate real-time SIQS for this location with improved accuracy
            const result = await calculateRealTimeSiqs(
              point.latitude, 
              point.longitude,
              point.bortleScale || 5
            );
            
            // Enhanced viability check
            if (result.isViable && result.siqs >= 2.5) {
              // Generate a better name based on estimated location quality
              const qualityIndicator = getQualityIndicator(result.siqs);
              
              return {
                ...point,
                id: `calc-loc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                siqs: result.siqs,
                isViable: result.isViable,
                name: `${qualityIndicator} Dark Sky Location`,
                chineseName: `${getChineseQualityIndicator(result.siqs)}暗夜地点`,
                distance: calculateDistance(latitude, longitude, point.latitude, point.longitude),
                timestamp: new Date().toISOString(),
                date: new Date().toISOString(),
                certification: '',
                description: '',
                isDarkSkyReserve: false,
                siqsFactors: result.factors // Store factors for display
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
          // Enhanced filtering with improved coordinate precision
          const existingCoords = new Set(allLocations.map(loc => 
            `${loc.latitude.toFixed(5)},${loc.longitude.toFixed(5)}`
          ));
          
          const newLocations = calculatedResults.filter(loc => {
            const coordKey = `${loc.latitude.toFixed(5)},${loc.longitude.toFixed(5)}`;
            return !existingCoords.has(coordKey);
          });
          
          // Add new locations with proper sorting by quality
          allLocations = [...allLocations, ...newLocations];
        }
      }
      
      // Return sorted locations limited to requested amount, prioritizing higher SIQS scores
      return allLocations
        .sort((a, b) => (b.siqs || 0) - (a.siqs || 0))
        .slice(0, limit);
    } catch (error) {
      console.error("Error finding calculated locations:", error);
      return [];
    } finally {
      setCalculatingLocations(false);
    }
  }, []);

  // Enhanced grid generation with better distribution
  const generateSmartGridPoints = (latitude: number, longitude: number, radius: number): Partial<SharedAstroSpot>[] => {
    const points: Partial<SharedAstroSpot>[] = [];
    
    // Create a denser grid for better coverage
    const gridSize = Math.min(8, Math.ceil(radius / 60)); 
    
    // Convert radius from km to degrees (approximate)
    const latDelta = radius / 111; // 1 degree latitude is about 111km
    const lonDelta = radius / (111 * Math.cos(latitude * Math.PI / 180));
    
    // Create points in multiple patterns: grid, spiral, and random
    
    // 1. Grid pattern with varying density
    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        // Skip the center point (user location)
        if (i === 0 && j === 0) continue;
        
        // Make grid denser on edges to find edges of good viewing areas
        const density = Math.abs(i) + Math.abs(j) > gridSize ? 1.2 : 1.0;
        
        const lat = latitude + (i * latDelta / gridSize) * density;
        const lon = longitude + (j * lonDelta / gridSize) * density;
        
        // Enhanced bortle scale estimation that takes into account distance from urban areas
        const distance = Math.sqrt(i*i + j*j) / gridSize;
        // Bortle scale is 1-9, with lower being better - invert relationship with distance
        // Areas further from center are likely to have lower light pollution
        const estimatedBortle = Math.max(1, Math.min(9, Math.round(6 - 4 * distance)));
        
        points.push({
          name: `Potential Dark Sky Location`,
          latitude: lat,
          longitude: lon,
          bortleScale: estimatedBortle,
          id: `calc-loc-${Date.now()}-${i}-${j}`,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // 2. Add some random points for diversity
    for (let i = 0; i < gridSize * 2; i++) {
      // Random angle and distance
      const angle = Math.random() * 2 * Math.PI;
      const dist = Math.random() * radius;
      
      // Convert to x, y
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      
      // Convert to lat, lon
      const latOffset = y / 111;
      const lonOffset = x / (111 * Math.cos(latitude * Math.PI / 180));
      
      const lat = latitude + latOffset;
      const lon = longitude + lonOffset;
      
      // Estimated bortle - random points tend to be better at finding dark sky pockets
      const distanceFactor = dist / radius;
      const estimatedBortle = Math.max(1, Math.min(8, Math.round(5 - 3 * distanceFactor)));
      
      points.push({
        name: `Random Dark Sky Location`,
        latitude: lat,
        longitude: lon,
        bortleScale: estimatedBortle,
        id: `calc-loc-${Date.now()}-r-${i}`,
        timestamp: new Date().toISOString()
      });
    }
    
    // De-duplicate by coordinates (5 decimal places)
    const uniquePoints = new Map<string, Partial<SharedAstroSpot>>();
    points.forEach(point => {
      const key = `${point.latitude?.toFixed(5)},${point.longitude?.toFixed(5)}`;
      if (!uniquePoints.has(key)) {
        uniquePoints.set(key, point);
      }
    });
    
    return Array.from(uniquePoints.values());
  };

  // Helper for quality indicator based on SIQS score
  const getQualityIndicator = (siqs: number): string => {
    if (siqs >= 8) return "Premium";
    if (siqs >= 6.5) return "Excellent";
    if (siqs >= 5) return "Great";
    if (siqs >= 4) return "Good";
    return "Decent";
  };
  
  // Helper for Chinese quality indicator
  const getChineseQualityIndicator = (siqs: number): string => {
    if (siqs >= 8) return "顶级";
    if (siqs >= 6.5) return "极佳";
    if (siqs >= 5) return "优良";
    if (siqs >= 4) return "良好";
    return "尚可";
  };

  return {
    findCalculatedLocations,
    calculatingLocations
  };
};
