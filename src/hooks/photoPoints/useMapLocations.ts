
import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation } from '@/utils/locationValidator';
import { calculateDistance } from '@/utils/geoUtils';
import { updateLocationsWithRealTimeSiqs } from '@/services/realTimeSiqsService/locationUpdateService';

interface UseMapLocationsProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  mapReady: boolean;
}

// Minimum distance in kilometers between calculated spots to prevent clustering
const MIN_CALCULATED_DISTANCE = 5; // 5km minimum distance between calculated points

/**
 * Hook to handle location filtering, sorting and enhancement for map display
 */
export const useMapLocations = ({
  userLocation,
  locations,
  searchRadius,
  activeView,
  mapReady
}: UseMapLocationsProps) => {
  const [enhancedLocations, setEnhancedLocations] = useState<SharedAstroSpot[]>([]);
  const [processedLocations, setProcessedLocations] = useState<SharedAstroSpot[]>([]);

  // Filter out invalid locations and water spots
  const filterValidLocations = useCallback((locations: SharedAstroSpot[]): SharedAstroSpot[] => {
    return locations.filter(location => 
      location && 
      typeof location.latitude === 'number' && 
      typeof location.longitude === 'number' &&
      // Filter out water locations for calculated spots, never filter certified
      (location.isDarkSkyReserve || 
       location.certification || 
       !isWaterLocation(location.latitude, location.longitude, false))
    );
  }, []);

  // Extract certified and calculated locations
  const separateLocationTypes = useCallback((locations: SharedAstroSpot[]) => {
    const certifiedLocations = locations.filter(location => 
      location.isDarkSkyReserve === true || 
      (location.certification && location.certification !== '')
    );
    
    const calculatedLocations = locations.filter(location => 
      !(location.isDarkSkyReserve === true || 
      (location.certification && location.certification !== ''))
    );

    return { certifiedLocations, calculatedLocations };
  }, []);

  // Apply minimum distance filter to calculated spots to prevent clustering
  const applyMinDistanceFilter = useCallback((locations: SharedAstroSpot[]): SharedAstroSpot[] => {
    const result: SharedAstroSpot[] = [];
    const { certifiedLocations, calculatedLocations } = separateLocationTypes(locations);
    
    // Always include all certified locations
    result.push(...certifiedLocations);
    
    // For calculated locations, ensure minimum distance between points
    if (calculatedLocations.length > 0) {
      // Sort by quality (SIQS) first
      const sortedCalculatedLocations = [...calculatedLocations].sort((a, b) => {
        return (b.siqs || 0) - (a.siqs || 0);
      });
      
      // Add filtered calculated locations
      sortedCalculatedLocations.forEach(location => {
        // Check if this location is too close to any existing location
        const tooClose = result.some(existingLocation => {
          // Never filter out by distance for certified locations
          if (location.isDarkSkyReserve || location.certification) return false;
          
          if (!location.latitude || !location.longitude || 
              !existingLocation.latitude || !existingLocation.longitude) return false;
          
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            existingLocation.latitude,
            existingLocation.longitude
          );
          
          return distance < MIN_CALCULATED_DISTANCE;
        });
        
        // If not too close, add it to the result
        if (!tooClose) {
          result.push(location);
        }
      });
    }
    
    return result;
  }, [separateLocationTypes]);

  // Merge locations according to active view
  const mergeLocations = useCallback((
    certifiedLocations: SharedAstroSpot[], 
    calculatedLocations: SharedAstroSpot[],
    activeView: 'certified' | 'calculated'
  ) => {
    const locationMap = new Map<string, SharedAstroSpot>();
    
    // Always include all certified locations regardless of active view
    certifiedLocations.forEach(loc => {
      if (loc.latitude && loc.longitude) {
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        locationMap.set(key, loc);
      }
    });
    
    // Add calculated locations only if in calculated view
    if (activeView === 'calculated') {
      calculatedLocations.forEach(loc => {
        // Skip water locations for calculated spots
        if (loc.latitude && loc.longitude && !isWaterLocation(loc.latitude, loc.longitude)) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          const existing = locationMap.get(key);
          if (!existing || (loc.siqs && (!existing.siqs || loc.siqs > existing.siqs))) {
            locationMap.set(key, loc);
          }
        }
      });
    }
    
    return Array.from(locationMap.values());
  }, []);

  // Update locations with real-time SIQS
  const updateWithRealTimeSiqs = useCallback(async () => {
    if (!mapReady || !userLocation || !locations.length) return;
    
    try {
      const validLocations = filterValidLocations(locations);
      const { certifiedLocations, calculatedLocations } = separateLocationTypes(validLocations);
      
      // Always include ALL certified locations
      let locationsToUpdate = [...certifiedLocations];
      
      // For calculated view, also add calculated locations in radius
      if (activeView === 'calculated' && userLocation) {
        const calculatedInRadius = calculatedLocations.filter(loc => {
          if (!loc.latitude || !loc.longitude) return false;
          
          // Skip water locations for calculated spots
          if (!loc.isDarkSkyReserve && !loc.certification) {
            if (isWaterLocation(loc.latitude, loc.longitude)) {
              return false;
            }
          }
          
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            loc.latitude,
            loc.longitude
          );
          return distance <= searchRadius * 1.1;
        });
        
        locationsToUpdate = [...locationsToUpdate, ...calculatedInRadius];
      }
      
      // Apply minimum distance filter to prevent clustering
      locationsToUpdate = applyMinDistanceFilter(locationsToUpdate);
      
      const updated = await updateLocationsWithRealTimeSiqs(
        locationsToUpdate, 
        userLocation, 
        searchRadius,
        activeView
      );
      
      if (updated && updated.length > 0) {
        setEnhancedLocations(prevLocations => {
          const combinedLocations = [...prevLocations];
          
          updated.forEach(newLoc => {
            if (!newLoc.latitude || !newLoc.longitude) return;
            
            // Skip water locations for calculated spots
            if (!newLoc.isDarkSkyReserve && !newLoc.certification && 
                isWaterLocation(newLoc.latitude, newLoc.longitude)) {
              return;
            }
            
            const key = `${newLoc.latitude.toFixed(6)}-${newLoc.longitude.toFixed(6)}`;
            const exists = combinedLocations.some(
              existingLoc => existingLoc.latitude && existingLoc.longitude && 
              `${existingLoc.latitude.toFixed(6)}-${existingLoc.longitude.toFixed(6)}` === key
            );
            
            if (!exists) {
              combinedLocations.push(newLoc);
            } else {
              const index = combinedLocations.findIndex(
                existingLoc => existingLoc.latitude && existingLoc.longitude &&
                `${existingLoc.latitude.toFixed(6)}-${existingLoc.longitude.toFixed(6)}` === key
              );
              if (index !== -1) {
                combinedLocations[index] = newLoc;
              }
            }
          });
          
          return combinedLocations;
        });
      }
    } catch (error) {
      console.error('Error updating locations with real-time SIQS:', error);
    }
  }, [locations, userLocation, mapReady, searchRadius, activeView, filterValidLocations, separateLocationTypes, applyMinDistanceFilter]);

  // Process locations
  useEffect(() => {
    const validLocations = filterValidLocations(locations);
    const { certifiedLocations, calculatedLocations } = separateLocationTypes(validLocations);
    const mergedLocations = mergeLocations(certifiedLocations, calculatedLocations, activeView);
    
    // Apply minimum distance filter to prevent clustering
    const filteredLocations = applyMinDistanceFilter(mergedLocations);
    
    // Use enhanced locations if available, otherwise use filtered locations
    const locationsToShow = enhancedLocations.length > 0 ? 
      applyMinDistanceFilter(enhancedLocations) : 
      filteredLocations;
    
    setProcessedLocations(locationsToShow);
    
  }, [locations, activeView, enhancedLocations, filterValidLocations, separateLocationTypes, mergeLocations, applyMinDistanceFilter]);

  // Update locations with real-time SIQS
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateWithRealTimeSiqs();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [updateWithRealTimeSiqs]);

  return {
    processedLocations
  };
};
