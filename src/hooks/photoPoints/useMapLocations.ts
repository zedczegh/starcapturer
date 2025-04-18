
import { useState, useEffect, useCallback, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { 
  filterValidLocations, 
  separateLocationTypes, 
  mergeLocations 
} from '@/utils/locationFiltering';
import { isWaterLocation } from '@/utils/locationWaterCheck';

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
    
    // Create a unique signature for this location set
    const locationSignature = locations.length + '-' + (userLocation ? 
      `${userLocation.latitude.toFixed(4)}-${userLocation.longitude.toFixed(4)}` : 
      'null-location');
    
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
    
    // Important: Always preserve existing locations regardless of new batch or location change
    previousLocationsRef.current.forEach((loc, key) => {
      if (!newLocationsMap.has(key)) {
        // When in calculated view, keep all previously visible locations
        if (activeView === 'calculated') {
          // For non-certified locations, respect search radius
          if (userLocation && !loc.isDarkSkyReserve && !loc.certification) {
            const distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              loc.latitude,
              loc.longitude
            );
            
            // Only filter by water for non-certified locations
            // But DON'T filter by distance when locations have just changed, to preserve spots
            if ((!locationChanged || distance <= searchRadius) && 
                !isWaterLocation(loc.latitude, loc.longitude, false)) {
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
          // For calculated view, include both calculated and certified locations
          // This ensures calculated view shows all appropriate locations
          locationsToShow = [...calculatedLocations, ...certifiedLocations] as SharedAstroSpot[];
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
        try {
          const storageKey = activeView === 'calculated' ? 'persistent_calculated_locations' : 'persistent_certified_locations';
          const simplifiedLocations = allLocations.map(loc => ({
            id: loc.id || `loc-${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`,
            name: loc.name || 'Unknown Location',
            latitude: loc.latitude,
            longitude: loc.longitude,
            siqs: loc.siqs,
            isDarkSkyReserve: loc.isDarkSkyReserve,
            certification: loc.certification,
            distance: loc.distance
          }));
          sessionStorage.setItem(storageKey, JSON.stringify(simplifiedLocations));
          console.log(`Stored ${simplifiedLocations.length} locations in session storage under ${storageKey}`);
        } catch (err) {
          console.error('Error storing locations in session storage:', err);
        }
        
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
