import { useState, useEffect, useCallback, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
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
 * Hook to handle location filtering and sorting for map display
 * Optimized for mobile performance by removing unnecessary calculations
 * Added persistence for calculated locations when changing views
 */
export const useMapLocations = ({
  userLocation,
  locations,
  searchRadius,
  activeView,
  mapReady
}: UseMapLocationsProps) => {
  const [processedLocations, setProcessedLocations] = useState<SharedAstroSpot[]>([]);
  const previousLocationsRef = useRef<SharedAstroSpot[]>([]);
  const previousActiveViewRef = useRef<string>(activeView);
  const processingRef = useRef<boolean>(false);
  const locationCacheRef = useRef<Map<string, SharedAstroSpot>>(new Map());
  
  // Process locations with throttling to prevent UI flashing
  useEffect(() => {
    // Skip if already processing
    if (processingRef.current) return;
    
    // Performance optimization - cache location signatures to avoid reprocessing
    const locationSignature = locations.length + '-' + (userLocation ? 
      `${userLocation.latitude.toFixed(4)}-${userLocation.longitude.toFixed(4)}` : 
      'null-location');
    
    const viewChanged = activeView !== previousActiveViewRef.current;
    
    processingRef.current = true;
    
    // Always preserve calculated locations, even when switching views
    let allLocations = [...locations];
    
    // When location changes, keep existing locations that are still valid
    if (userLocation && previousLocationsRef.current.length > 0) {
      console.log("Preserving valid locations while updating...");
      
      // Create lookup map for new locations
      const newLocationMap = new Map<string, boolean>();
      locations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          newLocationMap.set(key, true);
        }
      });
      
      // Keep locations from previous set that aren't duplicates
      const previousToKeep = previousLocationsRef.current.filter(loc => {
        if (!loc.latitude || !loc.longitude) return false;
        
        const locKey = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        
        // Don't keep if already in new locations
        if (newLocationMap.has(locKey)) return false;
        
        // For calculated view, filter by distance
        if (activeView === 'calculated' && userLocation && !loc.isDarkSkyReserve && !loc.certification) {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            loc.latitude,
            loc.longitude
          );
          
          // Only keep locations within search radius
          return distance <= searchRadius;
        }
        
        // Keep all certified locations regardless
        return loc.isDarkSkyReserve || loc.certification;
      });
      
      // Merge and update the full set
      allLocations = [...allLocations, ...previousToKeep];
      console.log(`Preserved ${previousToKeep.length} locations from previous view`);
    }
    
    // Update the previous view and locations
    previousActiveViewRef.current = activeView;
    previousLocationsRef.current = allLocations;
    
    // Use a shorter timeout to improve loading speed
    const timeoutId = setTimeout(() => {
      try {
        // Optimize by doing less processing for larger location sets
        const validLocations = filterValidLocations(allLocations);
        
        // Separate locations by type
        const { certifiedLocations, calculatedLocations } = separateLocationTypes(validLocations);
        console.log(`Location counts - certified: ${certifiedLocations.length}, calculated: ${calculatedLocations.length}, total: ${validLocations.length}`);
        
        // In certified view, only show certified locations
        // In calculated view, show either certified OR calculated locations based on activeView
        let locationsToShow;
        
        if (activeView === 'certified') {
          locationsToShow = certifiedLocations;
        } else {
          // For calculated view, show all locations optimized for device
          locationsToShow = calculatedLocations;
          
          // Also include certified locations, but only if explicitly requested
          if (!viewChanged || userLocation) {
            // Merge with certified, limited for performance
            locationsToShow = [...certifiedLocations, ...calculatedLocations];
          }
        }
        
        setProcessedLocations(locationsToShow);
      } catch (error) {
        console.error('Error processing map locations:', error);
      } finally {
        processingRef.current = false;
      }
    }, 50); // Faster timeout for better responsiveness
    
    return () => clearTimeout(timeoutId);
  }, [locations, activeView, searchRadius, userLocation]);

  return {
    processedLocations
  };
};
