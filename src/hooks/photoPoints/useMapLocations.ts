
import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { updateLocationsWithRealTimeSiqs } from '@/services/realTimeSiqsService/locationUpdateService';
import { 
  filterValidLocations, 
  separateLocationTypes, 
  mergeLocations 
} from '@/utils/locationFiltering';
import { preFilterWaterLocations } from '@/utils/markerUtils';

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

  // Update locations with real-time SIQS
  const updateWithRealTimeSiqs = useCallback(async () => {
    if (!mapReady || !locations.length) return;
    
    try {
      const validLocations = filterValidLocations(locations);
      const { certifiedLocations, calculatedLocations } = separateLocationTypes(validLocations);
      
      // Pre-filter water locations from calculated spots
      const filteredCalculatedLocations = preFilterWaterLocations(calculatedLocations);
      
      // Only update locations relevant to current view
      const locationsToUpdate = activeView === 'certified' 
        ? certifiedLocations 
        : [...certifiedLocations, ...filteredCalculatedLocations.filter(loc => {
            // Filter by distance for calculated view
            if (userLocation && loc.latitude && loc.longitude) {
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
        const filteredUpdated = preFilterWaterLocations(updated);
        
        setEnhancedLocations(prevLocations => {
          const combinedLocations = [...prevLocations];
          
          filteredUpdated.forEach(newLoc => {
            if (!newLoc.latitude || !newLoc.longitude) return;
            
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
    
    // Return false to avoid TypeScript Promise<boolean> error
    return false;
  }, [locations, userLocation, mapReady, searchRadius, activeView]);

  // Process locations
  useEffect(() => {
    const validLocations = filterValidLocations(locations);
    const { certifiedLocations, calculatedLocations } = separateLocationTypes(validLocations);
    
    // Pre-filter water locations from calculated spots
    const filteredCalculatedLocations = preFilterWaterLocations(calculatedLocations);
    
    const mergedLocations = mergeLocations(
      certifiedLocations, 
      filteredCalculatedLocations, 
      activeView
    );
    
    // Use enhanced locations if available, otherwise use merged locations
    const locationsToShow = enhancedLocations.length > 0 ? 
      // Apply active view filtering to enhanced locations
      activeView === 'certified' 
        ? enhancedLocations.filter(loc => loc.isDarkSkyReserve || loc.certification)
        : preFilterWaterLocations(enhancedLocations)  // Apply water filtering here too
      : mergedLocations;
    
    setProcessedLocations(locationsToShow);
    
  }, [locations, activeView, enhancedLocations]);

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
