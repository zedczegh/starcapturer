import { useState, useEffect, useCallback, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { 
  filterValidLocations, 
  separateLocationTypes, 
  mergeLocations 
} from '@/utils/locationFiltering';
import { isWaterLocation } from '@/utils/validation/waterLocationValidator';

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
    
    // Add all current locations to the map
    locations.forEach(loc => {
      if (loc && loc.latitude && loc.longitude) {
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        newLocationsMap.set(key, loc as SharedAstroSpot);
      }
    });
    
    // Preserve existing locations that aren't in the new batch
    previousLocationsRef.current.forEach((loc, key) => {
      if (!newLocationsMap.has(key)) {
        // Apply location filtering based on view mode
        if (activeView === 'calculated') {
          // Keep locations within search radius for calculated view
          if (userLocation && !loc.isDarkSkyReserve && !loc.certification) {
            const distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              loc.latitude,
              loc.longitude
            );
            
            // Always keep calculated locations within radius
            if (distance <= searchRadius) {
              newLocationsMap.set(key, loc as SharedAstroSpot);
            }
          } else if (loc.isDarkSkyReserve || loc.certification) {
            // Always keep certified locations
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
        const validLocations = allLocations.filter(loc => 
          loc && loc.latitude && loc.longitude
        );
        
        // Separate locations by type
        const certifiedLocations = validLocations.filter(loc => 
          loc.isDarkSkyReserve || loc.certification
        );
        
        const calculatedLocations = validLocations.filter(loc => 
          !loc.isDarkSkyReserve && !loc.certification
        );
        
        console.log(`Location counts - certified: ${certifiedLocations.length}, calculated: ${calculatedLocations.length}, total: ${validLocations.length}`);
        
        // Determine which locations to show based on view
        let locationsToShow: SharedAstroSpot[];
        
        if (activeView === 'certified') {
          // In certified view, only show certified locations
          locationsToShow = certifiedLocations as SharedAstroSpot[];
        } else {
          // For calculated view, show all valid locations
          locationsToShow = validLocations as SharedAstroSpot[];
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
