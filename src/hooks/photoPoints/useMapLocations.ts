
import { useState, useEffect, useCallback, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { 
  filterValidLocations, 
  separateLocationTypes, 
  mergeLocations 
} from '@/utils/locationFiltering';
import { isWaterLocation } from '@/utils/location/validators';
import { validateLocationWithReverseGeocoding } from '@/utils/location/reverseGeocodingValidator';

interface UseMapLocationsProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated' | 'obscura';
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
    
    // Load and restore persisted locations from session storage
    try {
      const persistedKey = activeView === 'certified' ? 
        'persistent_certified_locations' : 
        'persistent_calculated_locations';
      const persistedData = sessionStorage.getItem(persistedKey);
      
      if (persistedData) {
        const persistedLocations = JSON.parse(persistedData);
        if (Array.isArray(persistedLocations)) {
          console.log(`Loaded ${persistedLocations.length} persisted locations from session storage`);
          
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
        }
      }
    } catch (error) {
      console.error("Error loading persisted locations:", error);
    }
    
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
            
            // Important change: DON'T filter by distance when locations have just changed
            // This ensures spots remain visible after location updates
            if (!locationChanged || distance <= searchRadius) {
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
        console.log(`Location counts - certified: ${certifiedLocations.length}, calculated: ${calculatedLocations.length}, total: ${validLocations.length}`);
        
        // Apply water filtering using reverse geocoding for calculated locations
        const filteredCalculatedLocations = await Promise.all(
          calculatedLocations.map(async (loc) => {
            // Skip certified locations
            if (loc.isDarkSkyReserve || loc.certification) return loc;
            
            // Check if it's a water location using geocoding validation
            try {
              const isValid = await validateLocationWithReverseGeocoding(loc);
              // Return null for water locations (will be filtered out)
              return isValid ? loc : null;
            } catch (error) {
              console.warn("Error validating location:", error);
              // If validation fails, keep the location
              return loc;
            }
          })
        );
        
        // Filter out null values (water locations)
        const nonWaterCalculatedLocations = filteredCalculatedLocations.filter(
          loc => loc !== null
        ) as SharedAstroSpot[];
        
        console.log(`Filtered out ${calculatedLocations.length - nonWaterCalculatedLocations.length} water locations`);
        
        // Determine which locations to show based on view
        let locationsToShow: SharedAstroSpot[];
        
        if (activeView === 'certified') {
          // In certified view, only show certified locations
          locationsToShow = certifiedLocations as SharedAstroSpot[];
        } else {
          // For calculated view, include both calculated and certified locations
          // This ensures calculated view shows all appropriate locations
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
        try {
          const storageKey = activeView === 'calculated' ? 'persistent_calculated_locations' : 'persistent_certified_locations';
          
          // Load existing data to merge with
          const existingData = sessionStorage.getItem(storageKey);
          let combinedLocations = [...allLocations];
          
          if (existingData) {
            try {
              const existingLocations = JSON.parse(existingData);
              
              // Use a Map to deduplicate by coordinates
              const tempMap = new Map<string, SharedAstroSpot>();
              
              // Add existing locations first
              if (Array.isArray(existingLocations)) {
                existingLocations.forEach(loc => {
                  if (loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
                    const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
                    tempMap.set(key, loc);
                  }
                });
              }
              
              // Add new locations, overriding existing ones with same coordinates
              allLocations.forEach(loc => {
                if (loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
                  const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
                  tempMap.set(key, loc);
                }
              });
              
              // Convert back to array
              combinedLocations = Array.from(tempMap.values());
              console.log(`Combined with existing storage: now ${combinedLocations.length} locations`);
            } catch (error) {
              console.error("Error parsing existing stored locations:", error);
              // Fallback to just using new locations
            }
          }
          
          // Store the combined data
          const simplifiedLocations = combinedLocations.map(loc => ({
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
