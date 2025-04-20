
import { useState, useEffect, useCallback, useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface UseLocationCacheProps {
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  activeView: 'certified' | 'calculated';
}

export function useLocationCache({
  certifiedLocations,
  calculatedLocations,
  activeView
}: UseLocationCacheProps) {
  // Memoize effective locations to prevent unnecessary rerenders
  const effectiveLocations = useMemo(() => {
    if (activeView === 'certified') {
      return certifiedLocations;
    } else {
      // For calculated view, include both certified AND calculated locations
      // Use a Map to deduplicate by coordinates
      const locationMap = new Map<string, SharedAstroSpot>();
      
      // Add certified locations first to ensure they get priority
      certifiedLocations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          locationMap.set(key, loc);
        }
      });
      
      // Then add calculated locations
      calculatedLocations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          if (!locationMap.has(key)) {
            locationMap.set(key, loc);
          }
        }
      });
      
      return Array.from(locationMap.values());
    }
  }, [certifiedLocations, calculatedLocations, activeView]);

  // Function to store locations in persistent cache for faster loading
  const storeLocationsInCache = useCallback((locations: SharedAstroSpot[], activeView: string) => {
    try {
      // Store ALL locations in session storage for persistence
      const storageKey = activeView === 'certified' ? 
        'persistent_certified_locations' : 
        'persistent_calculated_locations';
      
      // Use a debounced approach with requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        // Load existing locations first to avoid overwriting 
        const existingData = sessionStorage.getItem(storageKey);
        
        // Only store the most important fields to reduce storage size
        const simplifiedLocations = locations.map(loc => ({
          id: loc.id || `loc-${loc.latitude?.toFixed(6)}-${loc.longitude?.toFixed(6)}`,
          name: loc.name || 'Unknown Location',
          latitude: loc.latitude,
          longitude: loc.longitude,
          siqs: loc.siqs,
          isDarkSkyReserve: loc.isDarkSkyReserve,
          certification: loc.certification,
          distance: loc.distance
        }));
        
        let combinedLocations = simplifiedLocations;
        
        if (existingData) {
          try {
            const existingLocations = JSON.parse(existingData);
            
            // Create a map to deduplicate by coordinates
            const locationMap = new Map();
            
            // Add existing locations first
            if (Array.isArray(existingLocations)) {
              existingLocations.forEach(loc => {
                if (loc && loc.latitude && loc.longitude) {
                  const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
                  locationMap.set(key, loc);
                }
              });
            }
            
            // Add new locations, overwriting existing ones if they have the same coordinates
            simplifiedLocations.forEach(loc => {
              if (loc && loc.latitude && loc.longitude) {
                const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
                locationMap.set(key, loc);
              }
            });
            
            // Convert back to array
            combinedLocations = Array.from(locationMap.values());
          } catch (err) {
            console.error('Error parsing existing locations:', err);
          }
        }
        
        // Store the merged locations
        sessionStorage.setItem(storageKey, JSON.stringify(combinedLocations));
        console.log(`Stored ${combinedLocations.length} ${activeView} locations to session storage`);
      });
    } catch (err) {
      console.error('Error storing locations in session storage:', err);
    }
  }, []);
  
  // Also always store certified locations separately to ensure they're available
  useEffect(() => {
    if (certifiedLocations && certifiedLocations.length > 0) {
      // Use requestAnimationFrame to avoid blocking the main thread
      requestAnimationFrame(() => {
        try {
          sessionStorage.setItem('certified_locations_backup', JSON.stringify(certifiedLocations));
          console.log(`Stored ${certifiedLocations.length} certified locations to backup storage`);
        } catch (err) {
          console.error('Error storing certified locations in backup storage:', err);
        }
      });
    }
  }, [certifiedLocations]);

  return {
    effectiveLocations,
    storeLocationsInCache
  };
}
