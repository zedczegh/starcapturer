
import { useState, useEffect, useCallback, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { 
  filterValidLocations, 
  separateLocationTypes, 
  mergeLocations 
} from '@/utils/locationFiltering';
import { isWaterLocation } from '@/utils/locationWaterCheck';
import { isValidAstronomyLocation } from '@/utils/locationValidator';

interface UseMapLocationsProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  mapReady: boolean;
}

/**
 * Hook to handle location filtering and sorting for map display
 * Optimized for mobile performance with better caching and improved location persistence
 */
export const useMapLocations = ({
  userLocation,
  locations,
  searchRadius,
  activeView,
  mapReady
}: UseMapLocationsProps) => {
  const [processedLocations, setProcessedLocations] = useState<SharedAstroSpot[]>([]);
  const previousLocationsRef = useRef<Map<string, SharedAstroSpot>>(new Map());
  const previousActiveViewRef = useRef<string>(activeView);
  const processingRef = useRef<boolean>(false);
  const locationCacheRef = useRef<Map<string, SharedAstroSpot>>(new Map());
  
  // Process locations with throttling to prevent UI flashing
  useEffect(() => {
    // Skip if already processing
    if (processingRef.current) return;
    
    // Create a unique signature for this location set
    const locationSignature = locations.length + '-' + (userLocation ? 
      `${userLocation.latitude.toFixed(4)}-${userLocation.longitude.toFixed(4)}` : 
      'null-location');
    
    const viewChanged = activeView !== previousActiveViewRef.current;
    
    processingRef.current = true;
    
    // Use a Map for more efficient lookups compared to array
    const newLocationsMap = new Map<string, SharedAstroSpot>();
    
    // Add all current locations to the map, filtering out water locations for calculated spots
    locations.forEach(loc => {
      if (loc.latitude && loc.longitude) {
        // Only perform water check for calculated locations
        const isCertified = loc.isDarkSkyReserve || loc.certification;
        
        // Skip water locations (only for calculated spots)
        if (!isCertified && !isValidAstronomyLocation(loc.latitude, loc.longitude, loc.name)) {
          console.log(`Skipping water location at ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
          return;
        }
        
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        newLocationsMap.set(key, loc as SharedAstroSpot);
      }
    });
    
    // Preserve existing locations that aren't in the new batch
    previousLocationsRef.current.forEach((loc, key) => {
      if (!newLocationsMap.has(key)) {
        // Apply location filtering based on view mode
        if (activeView === 'calculated') {
          // Keep locations within search radius
          if (userLocation && !loc.isDarkSkyReserve && !loc.certification) {
            const distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              loc.latitude,
              loc.longitude
            );
            
            // Filter out locations outside search radius or in water
            if (distance <= searchRadius && isValidAstronomyLocation(loc.latitude, loc.longitude, loc.name)) {
              newLocationsMap.set(key, loc as SharedAstroSpot);
            }
          } else if (loc.isDarkSkyReserve || loc.certification) {
            // Keep certified locations
            newLocationsMap.set(key, loc as SharedAstroSpot);
          }
        } else if (activeView === 'certified' && (loc.isDarkSkyReserve || loc.certification)) {
          // For certified view, only keep certified locations
          newLocationsMap.set(key, loc as SharedAstroSpot);
        }
      }
    });
    
    // Convert Map back to array
    const allLocations = Array.from(newLocationsMap.values()) as SharedAstroSpot[];
    
    // Update previous locations for future use
    previousLocationsRef.current = newLocationsMap;
    previousActiveViewRef.current = activeView;
    
    // Use a shorter timeout to improve loading speed
    const timeoutId = setTimeout(() => {
      try {
        // Filter valid locations
        const validLocations = filterValidLocations(allLocations);
        
        // Separate locations by type
        const { certifiedLocations, calculatedLocations } = separateLocationTypes(validLocations);
        console.log(`Location counts - certified: ${certifiedLocations.length}, calculated: ${calculatedLocations.length}, total: ${validLocations.length}`);
        
        // Determine which locations to show based on view
        let locationsToShow: SharedAstroSpot[];
        
        if (activeView === 'certified') {
          // In certified view, only show certified locations
          locationsToShow = certifiedLocations as SharedAstroSpot[];
        } else {
          // For calculated view, show calculated locations
          locationsToShow = calculatedLocations as SharedAstroSpot[];
          
          // In calculated view, certified locations are handled separately in the UI
          // Only include certified locations if explicitly requested
          if (viewChanged || userLocation) {
            // Merge calculated and certified for calculated view
            locationsToShow = [...calculatedLocations] as SharedAstroSpot[];
          }
        }
        
        setProcessedLocations(locationsToShow);
      } catch (error) {
        console.error('Error processing map locations:', error);
      } finally {
        processingRef.current = false;
      }
    }, 30); // Even faster timeout for better responsiveness
    
    return () => clearTimeout(timeoutId);
  }, [locations, activeView, searchRadius, userLocation]);

  return {
    processedLocations
  };
};
