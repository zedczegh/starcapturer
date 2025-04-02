
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
        // Calculate points in a grid around the user location, avoiding water
        const gridPoints = generateGridPoints(latitude, longitude, searchRadius);
        
        // Calculate SIQS for each grid point (up to our limit)
        const promises = gridPoints.slice(0, limit * 3).map(async (point) => {
          try {
            // Check if the point might be in water (very basic check)
            if (isLikelyWater(point.latitude, point.longitude, latitude, longitude)) {
              return null;
            }
            
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
    
    // Add some randomization to the grid to avoid perfect grid patterns
    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        // Skip the center point
        if (i === 0 && j === 0) continue;
        
        // Add slight randomization to grid points
        const randomLatOffset = (Math.random() - 0.5) * (latDelta / gridSize / 2);
        const randomLonOffset = (Math.random() - 0.5) * (lonDelta / gridSize / 2);
        
        const lat = latitude + (i * latDelta / gridSize) + randomLatOffset;
        const lon = longitude + (j * lonDelta / gridSize) + randomLonOffset;
        
        // Estimate a Bortle scale based on distance from center
        // Further from urban areas generally means darker skies
        const distance = Math.sqrt(i*i + j*j) / gridSize;
        // Bortle scale is 1-9, with lower being better
        // Estimate lower Bortle as we go further from center
        const estimatedBortle = Math.max(1, Math.min(8, Math.round(5 - 3 * distance)));
        
        // Generate a name based on direction from the center
        const directionName = getDirectionName(i, j);
        
        points.push({
          name: `Dark site ${directionName} of ${lat.toFixed(2)}, ${lon.toFixed(2)}`,
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

  // Basic check to see if a point is likely in water
  // This is a very naive approach that helps avoid coastal areas and large bodies of water
  const isLikelyWater = (lat: number, lon: number, originLat: number, originLon: number): boolean => {
    // Avoid points that are too far from land - simplified check
    // If the point is very far from the origin and in a different direction than land masses,
    // it's more likely to be water
    const distance = calculateDistance(originLat, originLon, lat, lon);
    
    // Special case for known water regions (roughly)
    // Pacific Ocean region
    if ((lon < -120 && lon > -170) && (lat > 0 && lat < 60)) return true;
    // Atlantic Ocean region
    if ((lon < -30 && lon > -70) && (lat > 0 && lat < 50)) return true;
    // Indian Ocean region
    if ((lon > 50 && lon < 100) && (lat > -40 && lat < 0)) return true;
    
    // If the point and origin have a substantial water gap (like a strait or bay)
    // Check if midpoint is likely water by using simple latitude/longitude thresholds
    // This simple check helps with coastal areas
    const midLat = (originLat + lat) / 2;
    const midLon = (originLon + lon) / 2;
    
    // If it's far from the origin, it's more likely to be water
    return distance > 200 && ((lat - originLat) * (lon - originLon) > 0);
  };

  // Get a human-readable direction name based on grid position
  const getDirectionName = (x: number, y: number): string => {
    if (y > 0 && Math.abs(x) < Math.abs(y)/2) return "north";
    if (y < 0 && Math.abs(x) < Math.abs(y)/2) return "south";
    if (x > 0 && Math.abs(y) < Math.abs(x)/2) return "east";
    if (x < 0 && Math.abs(y) < Math.abs(x)/2) return "west";
    if (x > 0 && y > 0) return "northeast";
    if (x > 0 && y < 0) return "southeast";
    if (x < 0 && y > 0) return "northwest";
    if (x < 0 && y < 0) return "southwest";
    return "";
  };

  return {
    findCalculatedLocations,
    calculatingLocations
  };
};
