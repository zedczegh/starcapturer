
import { useState, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/lib/api';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';

export const useCalculatedLocationsFind = () => {
  const [calculatingLocations, setCalculatingLocations] = useState(false);

  // Find or calculate locations that might be good for astrophotography
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
        // Calculate points in a grid around the user location
        const gridPoints = generateGridPoints(latitude, longitude, searchRadius);
        
        // Calculate SIQS for each grid point (up to our limit)
        const promises = gridPoints.slice(0, limit * 2).map(async (point) => {
          try {
            // Calculate real-time SIQS for this location
            const result = await calculateRealTimeSiqs(
              point.latitude, 
              point.longitude,
              point.bortleScale || 5
            );
            
            // If the location is viable for astrophotography
            if (result.isViable && result.siqs > 2) {
              return {
                ...point,
                id: `calc-loc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                siqs: result.siqs,
                isViable: result.isViable,
                distance: calculateDistance(latitude, longitude, point.latitude, point.longitude),
                timestamp: new Date().toISOString(),
                date: new Date().toISOString(),
                certification: '',
                chineseName: '',
                description: '',
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
          // Filter out duplicates (same approximate coordinates)
          const existingCoords = new Set(allLocations.map(loc => 
            `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`
          ));
          
          const newLocations = calculatedResults.filter(loc => {
            const coordKey = `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;
            return !existingCoords.has(coordKey);
          });
          
          allLocations = [...allLocations, ...newLocations];
        }
      }
      
      // Return sorted locations limited to requested amount
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

  // Generate a grid of points around the given coordinates
  const generateGridPoints = (latitude: number, longitude: number, radius: number): Partial<SharedAstroSpot>[] => {
    const points: Partial<SharedAstroSpot>[] = [];
    // Increase grid density for better coverage
    const gridSize = Math.min(6, Math.ceil(radius / 80)); 
    
    // Convert radius from km to degrees (approximate)
    const latDelta = radius / 111; // 1 degree latitude is about 111km
    const lonDelta = radius / (111 * Math.cos(latitude * Math.PI / 180));
    
    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        // Skip the center point
        if (i === 0 && j === 0) continue;
        
        const lat = latitude + (i * latDelta / gridSize);
        const lon = longitude + (j * lonDelta / gridSize);
        
        // Estimate a Bortle scale based on distance from center
        // Further from urban areas generally means darker skies
        const distance = Math.sqrt(i*i + j*j) / gridSize;
        // Bortle scale is 1-9, with lower being better
        // Estimate lower Bortle as we go further from center
        const estimatedBortle = Math.max(1, Math.min(8, Math.round(5 - 3 * distance)));
        
        points.push({
          name: `Location ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
          latitude: lat,
          longitude: lon,
          bortleScale: estimatedBortle,
          id: `calc-loc-${Date.now()}-${i}-${j}`,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return points;
  };

  // Convert to proper AstroSpot
  const convertToAstroSpot = (location: any): SharedAstroSpot => {
    return {
      id: location.id || `calc-loc-${Date.now()}`, // Generate id if none exists
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      bortleScale: location.bortleScale,
      timestamp: location.timestamp || new Date().toISOString(),
      distance: location.distance,
      siqs: location.siqs,
      // Add other required SharedAstroSpot properties with defaults
      certification: location.certification || '',
      chineseName: location.chineseName || '',
      description: location.description || '',
      isViable: location.isViable || true,
      isDarkSkyReserve: location.isDarkSkyReserve || false,
      date: location.date || new Date().toISOString()
    };
  };

  // Update the function to use the converter when creating calculated locations
  const createCalculatedLocation = (
    lat: number, 
    lng: number, 
    bortleScale: number, 
    distance: number, 
    counter: number,
    siqs: number
  ): SharedAstroSpot => {
    const enName = `Potential ideal dark site ${counter}`;
    const zhName = `潜在理想暗夜地点 ${counter}`;
    
    return convertToAstroSpot({
      name: enName,
      chineseName: zhName,
      latitude: lat,
      longitude: lng,
      bortleScale: bortleScale,
      distance: distance,
      siqs: siqs,
      isViable: siqs > 3,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString()
    });
  };

  return {
    findCalculatedLocations,
    calculatingLocations
  };
};
