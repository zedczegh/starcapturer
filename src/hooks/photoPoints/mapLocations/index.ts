
import { useState, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLocationCache } from './useLocationCache';
import { processLocations } from './locationProcessor';
import { filterLocationsByDistance } from './locationFilters';
import { saveLocationsToStorage, loadLocationsFromStorage } from './locationStorage';
import { UseMapLocationsProps, LocationMapState } from './types';

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
}: UseMapLocationsProps): LocationMapState => {
  const [processedLocations, setProcessedLocations] = useState<SharedAstroSpot[]>([]);
  const previousActiveViewRef = useRef<string>(activeView);
  const processingRef = useRef<boolean>(false);
  const previousUserLocationRef = useRef<{latitude: number, longitude: number} | null>(null);
  
  const { 
    updateCache, 
    getCachedLocationsForView, 
    updatePreviousLocations,
    getPreviousLocations
  } = useLocationCache();
  
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
    
    // Load and restore persisted locations from session storage
    const persistedLocations = loadLocationsFromStorage(activeView);
    persistedLocations.forEach(loc => {
      if (loc.latitude && loc.longitude) {
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        if (!newLocationsMap.has(key)) {
          // For calculated view, add all persisted calculated locations
          if (activeView === 'calculated' || (loc.isDarkSkyReserve || loc.certification)) {
            newLocationsMap.set(key, loc);
          }
        }
      }
    });
    
    // Important: Always preserve existing locations regardless of new batch or location change
    const previousLocations = getPreviousLocations();
    previousLocations.forEach((loc, key) => {
      if (!newLocationsMap.has(key)) {
        // Apply appropriate filtering based on active view
        const isCertified = Boolean(loc.isDarkSkyReserve || loc.certification);
        
        if (activeView === 'calculated' || (activeView === 'certified' && isCertified)) {
          const filtered = filterLocationsByDistance(
            [loc], 
            userLocation, 
            searchRadius, 
            locationChanged,
            isCertified
          );
          
          if (filtered.length > 0) {
            newLocationsMap.set(key, loc);
          }
        }
      }
    });
    
    // Convert Map back to array
    const allLocations = Array.from(newLocationsMap.values()) as SharedAstroSpot[];
    
    // Update previous locations for future use
    updatePreviousLocations(newLocationsMap);
    previousActiveViewRef.current = activeView;
    
    // Use a shorter timeout to improve loading speed
    const timeoutId = setTimeout(async () => {
      try {
        // Process locations with validations
        let locationsToShow = await processLocations(allLocations, activeView);
        
        // Make sure we don't lose previously shown locations when switching views
        if (viewChanged) {
          // Add locations from the cache when switching views
          const relevantCachedLocations = getCachedLocationsForView(activeView);
            
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
        
        // Save all locations to session storage for persistence
        saveLocationsToStorage(allLocations, activeView);
        
        // Update the location cache with all locations for future use
        updateCache(allLocations);
        
        setProcessedLocations(locationsToShow);
      } catch (error) {
        console.error('Error processing map locations:', error);
      } finally {
        processingRef.current = false;
      }
    }, 30); // Even faster timeout for better responsiveness
    
    return () => clearTimeout(timeoutId);
  }, [locations, activeView, searchRadius, userLocation, updateCache, getCachedLocationsForView, updatePreviousLocations, getPreviousLocations]);

  return {
    processedLocations
  };
};
