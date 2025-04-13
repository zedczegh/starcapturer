
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

  // Merge locations according to active view - UPDATED to strictly enforce view type filtering
  const mergeLocations = useCallback((
    certifiedLocations: SharedAstroSpot[], 
    calculatedLocations: SharedAstroSpot[],
    activeView: 'certified' | 'calculated'
  ) => {
    // For certified view, ONLY include certified locations
    if (activeView === 'certified') {
      return certifiedLocations;
    }
    
    // For calculated view, include both types but prioritize certified locations
    const locationMap = new Map<string, SharedAstroSpot>();
    
    // Always include all certified locations regardless of active view
    certifiedLocations.forEach(loc => {
      const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
      locationMap.set(key, loc);
    });
    
    // Add calculated locations
    calculatedLocations.forEach(loc => {
      // Skip water locations for calculated spots
      if (!isWaterLocation(loc.latitude, loc.longitude)) {
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        const existing = locationMap.get(key);
        if (!existing || (loc.siqs && (!existing.siqs || loc.siqs > existing.siqs))) {
          locationMap.set(key, loc);
        }
      }
    });
    
    return Array.from(locationMap.values());
  }, []);

  // Update locations with real-time SIQS
  const updateWithRealTimeSiqs = useCallback(async () => {
    if (!mapReady || !locations.length) return;
    
    try {
      const validLocations = filterValidLocations(locations);
      const { certifiedLocations, calculatedLocations } = separateLocationTypes(validLocations);
      
      // Only update locations relevant to current view
      const locationsToUpdate = activeView === 'certified' 
        ? certifiedLocations 
        : [...certifiedLocations, ...calculatedLocations.filter(loc => {
            // Skip water locations for calculated spots
            if (!loc.isDarkSkyReserve && !loc.certification) {
              if (isWaterLocation(loc.latitude, loc.longitude)) {
                return false;
              }
            }
            
            // Filter by distance for calculated view
            if (userLocation) {
              const distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                loc.latitude,
                loc.longitude
              );
              return distance <= searchRadius * 1.1;
            }
            
            return true;
          })];
      
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
  }, [locations, userLocation, mapReady, searchRadius, activeView, filterValidLocations, separateLocationTypes]);

  // Process locations
  useEffect(() => {
    const validLocations = filterValidLocations(locations);
    const { certifiedLocations, calculatedLocations } = separateLocationTypes(validLocations);
    const mergedLocations = mergeLocations(certifiedLocations, calculatedLocations, activeView);
    
    // Use enhanced locations if available, otherwise use merged locations
    const locationsToShow = enhancedLocations.length > 0 ? 
      // Apply active view filtering to enhanced locations
      activeView === 'certified' 
        ? enhancedLocations.filter(loc => loc.isDarkSkyReserve || loc.certification)
        : enhancedLocations
      : mergedLocations;
    
    setProcessedLocations(locationsToShow);
    
  }, [locations, activeView, enhancedLocations, filterValidLocations, separateLocationTypes, mergeLocations]);

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
