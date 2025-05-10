import { useState, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { 
  filterValidLocations, 
  separateLocationTypes
} from '@/utils/locationFiltering';
import { 
  persistLocationsToStorage,
  filterLocationsByDistance,
  filterWaterLocations,
  loadPersistedLocations
} from '@/utils/location/locationMapUtils';

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
  const previousUserLocationRef = useRef<{latitude: number, longitude: number} | null>(null);
  
  // Process locations with throttling to prevent UI flashing
  useEffect(() => {
    // Skip if already processing
    if (processingRef.current) return;
    
    // Track whether location has changed
    const locationChanged = userLocation && previousUserLocationRef.current && 
      (userLocation.latitude !== previousUserLocationRef.current.latitude ||
       userLocation.longitude !== previousUserLocationRef.current.longitude);
    
    // Update reference
    if (userLocation) {
      previousUserLocationRef.current = {...userLocation};
    }
    
    const viewChanged = activeView !== previousActiveViewRef.current;
    
    processingRef.current = true;
    
    // Use a Map for more efficient lookups compared to array
    const newLocationsMap = new Map<string, SharedAstroSpot>();
    
    // Add all current locations to the map
    locations.forEach(loc => {
      if (loc.latitude && loc.longitude) {
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        newLocationsMap.set(key, loc as SharedAstroSpot);
      }
    });
    
    // Load persisted locations
    newLocationsMap = loadPersistedLocations(newLocationsMap, activeView);
    
    // Important: Always preserve existing locations regardless of new batch or location change
    previousLocationsRef.current.forEach((loc, key) => {
      if (!newLocationsMap.has(key)) {
        // When in calculated view, keep all previously visible locations
        if (activeView === 'calculated') {
          // For non-certified locations, respect search radius
          if (userLocation && !loc.isDarkSkyReserve && !loc.certification) {
            // Important change: DON'T filter by distance when locations have just changed
            // This ensures spots remain visible after location updates
            if (!locationChanged || filterLocationsByDistance([loc], userLocation, searchRadius).length > 0) {
              newLocationsMap.set(key, loc);
            }
          } else if (loc.isDarkSkyReserve || loc.certification) {
            // Always keep certified locations
            newLocationsMap.set(key, loc);
          }
        } else if (activeView === 'certified' && (loc.isDarkSkyReserve || loc.certification)) {
          // For certified view, always keep certified locations
          newLocationsMap.set(key, loc);
        }
      }
    });
    
    // Convert Map back to array
    const allLocations = Array.from(newLocationsMap.values()) as SharedAstroSpot[];
    
    // Update previous locations for future use
    previousLocationsRef.current = newLocationsMap;
    previousActiveViewRef.current = activeView;
    
    // Use a shorter timeout to improve loading speed
    const timeoutId = setTimeout(async () => {
      try {
        // Filter valid locations
        const validLocations = filterValidLocations(allLocations);
        
        // Separate locations by type
        const { certifiedLocations, calculatedLocations } = separateLocationTypes(validLocations);
        
        // Filter out water locations
        const nonWaterCalculatedLocations = await filterWaterLocations(calculatedLocations);
        
        // Determine which locations to show based on view
        let locationsToShow: SharedAstroSpot[];
        
        if (activeView === 'certified') {
          // In certified view, only show certified locations
          locationsToShow = certifiedLocations as SharedAstroSpot[];
        } else {
          // For calculated view, include both calculated and certified locations
          locationsToShow = [...nonWaterCalculatedLocations, ...certifiedLocations] as SharedAstroSpot[];
        }
        
        // Make sure we don't lose previously shown locations when switching views
        if (viewChanged) {
          // Add locations from the cache when switching views
          const cachedLocations = Array.from(locationCacheRef.current.values());
          
          // Filter cached locations by type based on active view
          const relevantCachedLocations = activeView === 'certified' 
            ? cachedLocations.filter(loc => loc.isDarkSkyReserve || loc.certification)
            : cachedLocations;
            
          // Use a Map to deduplicate by coordinates
          const tempMap = new Map<string, SharedAstroSpot>();
          
          // Add current locations first
          locationsToShow.forEach(loc => {
            const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
            tempMap.set(key, loc);
          });
          
          // Add cached locations that don't overlap
          relevantCachedLocations.forEach(loc => {
            const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
            if (!tempMap.has(key)) {
              tempMap.set(key, loc);
            }
          });
          
          // Convert back to array
          locationsToShow = Array.from(tempMap.values());
        }
        
        // Save all locations to session storage for persistence across sessions
        const storageKey = activeView === 'calculated' ? 'persistent_calculated_locations' : 'persistent_certified_locations';
        persistLocationsToStorage(allLocations, storageKey);
        
        // Update the location cache with all locations for future use
        allLocations.forEach(loc => {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          locationCacheRef.current.set(key, loc);
        });
        
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
