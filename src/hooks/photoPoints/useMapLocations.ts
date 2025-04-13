
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
  const [error, setError] = useState<Error | null>(null);

  // Update locations with real-time SIQS with improved error handling
  const updateWithRealTimeSiqs = useCallback(async () => {
    if (!mapReady || !locations.length) return false;
    
    try {
      // Pre-filter invalid locations before processing
      const validLocations = locations.filter(loc => 
        loc && typeof loc.latitude === 'number' && 
        typeof loc.longitude === 'number' &&
        !isNaN(loc.latitude) && !isNaN(loc.longitude)
      );
      
      if (validLocations.length === 0) {
        console.log("No valid locations to update");
        return false;
      }
      
      // Process valid locations
      const filteredLocations = filterValidLocations(validLocations);
      const { certifiedLocations, calculatedLocations } = separateLocationTypes(filteredLocations);
      
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
        // Only update state if component is still mounted
        setEnhancedLocations(prevLocations => {
          const combinedLocations = [...prevLocations];
          
          const filteredUpdated = preFilterWaterLocations(updated);
          
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
        
        return true;
      }
    } catch (error) {
      console.error('Error updating locations with real-time SIQS:', error);
      setError(error instanceof Error ? error : new Error('Unknown error updating locations'));
    }
    
    return false;
  }, [locations, userLocation, mapReady, searchRadius, activeView]);

  // Process locations
  useEffect(() => {
    try {
      if (!locations) {
        setProcessedLocations([]);
        return;
      }
      
      // Ensure all locations are valid
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
    } catch (err) {
      console.error("Error processing locations:", err);
      setError(err instanceof Error ? err : new Error('Unknown error processing locations'));
    }
  }, [locations, activeView, enhancedLocations]);

  // Update locations with real-time SIQS with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateWithRealTimeSiqs();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [updateWithRealTimeSiqs]);

  return {
    processedLocations,
    error
  };
};

export default useMapLocations;
