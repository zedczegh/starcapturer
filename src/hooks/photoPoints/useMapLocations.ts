import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { updateLocationsWithRealTimeSiqs } from '@/services/realTimeSiqsService/locationUpdateService';
import { 
  filterValidLocations, 
  separateLocationTypes, 
  mergeLocations 
} from '@/utils/locationFiltering';

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
      
      // For certified view, always include all certified locations regardless of distance
      const locationsToUpdate = activeView === 'certified' 
        ? certifiedLocations 
        : [...certifiedLocations, ...calculatedLocations.filter(loc => {
            // Skip water locations for calculated spots
            if (!loc.isDarkSkyReserve && !loc.certification && (!loc.latitude || !loc.longitude)) {
              return false;
            }
            
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
      
      console.log(`Updating ${locationsToUpdate.length} locations with real-time SIQS data`);
      
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
    
    console.log(`Processing ${certifiedLocations.length} certified locations for display`);
    
    // For certified view, always include all certified locations
    // For calculated view, include all locations but apply filtering
    let locationsToShow;
    
    if (activeView === 'certified') {
      locationsToShow = enhancedLocations.length > 0 
        ? enhancedLocations.filter(loc => loc.isDarkSkyReserve || loc.certification)
        : certifiedLocations;
    } else {
      // For calculated view, use enhanced locations if available
      locationsToShow = enhancedLocations.length > 0 
        ? enhancedLocations
        : mergeLocations(certifiedLocations, calculatedLocations, activeView);
    }
    
    // Log certification types to help with debugging
    if (activeView === 'certified') {
      console.log("Certification types in display:", locationsToShow.map(l => l.certification));
    }
    
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
