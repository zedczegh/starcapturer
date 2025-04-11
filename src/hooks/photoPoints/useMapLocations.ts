
import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { updateLocationsWithRealTimeSiqs } from '@/services/realTimeSiqsService/locationUpdateService';
import { filterValidLocations, separateLocationTypes, mergeLocations, applyMinDistanceFilter } from './utils/locationFilters';

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
          const locationMap = new Map<string, SharedAstroSpot>();
          
          // Add existing locations to map
          prevLocations.forEach(loc => {
            if (loc.latitude && loc.longitude) {
              const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
              locationMap.set(key, loc);
            }
          });
          
          // Add or update with new locations
          updated.forEach(loc => {
            if (loc.latitude && loc.longitude) {
              const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
              locationMap.set(key, loc);
            }
          });
          
          // Convert map back to array
          return Array.from(locationMap.values());
        });
      }
    } catch (error) {
      console.error('Error updating locations with real-time SIQS:', error);
    }
  }, [locations, userLocation, mapReady, searchRadius, activeView]);

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
