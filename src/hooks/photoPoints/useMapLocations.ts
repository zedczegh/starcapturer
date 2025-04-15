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
  
  // Process locations with throttling to prevent UI flashing
  useEffect(() => {
    // Skip if already processing or no change in locations
    if (processingRef.current) return;
    if (locations === previousLocationsRef.current && 
        activeView === previousActiveViewRef.current) return;
    
    processingRef.current = true;
    
    // Always preserve calculated locations, even when switching views
    let allLocations = [...locations];
    
    // When switching from calculated to certified, keep calculated locations
    // in memory but don't display them
    if (activeView !== previousActiveViewRef.current) {
      previousLocationsRef.current = allLocations;
    } 
    // Otherwise, merge with previously seen locations
    else {
      // Extract IDs of all current locations
      const locationIds = new Set(allLocations.map(loc => 
        `${loc.latitude?.toFixed(6)}-${loc.longitude?.toFixed(6)}`
      ));
      
      // Keep locations from previous set that aren't duplicates
      const previousUniqueLocations = previousLocationsRef.current.filter(loc => {
        if (!loc.latitude || !loc.longitude) return false;
        const locId = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        return !locationIds.has(locId);
      });
      
      // Merge and update the full cache
      allLocations = [...allLocations, ...previousUniqueLocations];
      previousLocationsRef.current = allLocations;
    }
    
    previousActiveViewRef.current = activeView;
    
    // Use a timeout to batch updates and prevent UI flashing
    const timeoutId = setTimeout(() => {
      try {
        const validLocations = filterValidLocations(allLocations);
        const { certifiedLocations, calculatedLocations } = separateLocationTypes(validLocations);
        
        // For certified view, only include certified locations
        // For calculated view, include all locations with filtering
        let locationsToShow;
        
        if (activeView === 'certified') {
          locationsToShow = certifiedLocations;
        } else {
          // For calculated view, merge locations but limit quantity on mobile
          locationsToShow = mergeLocations(
            certifiedLocations, 
            calculatedLocations, // Keep all calculated locations
            activeView
          );
        }
        
        setProcessedLocations(locationsToShow);
      } catch (error) {
        console.error('Error processing map locations:', error);
      } finally {
        processingRef.current = false;
      }
    }, 150); // Delay updates to reduce flashing
    
    return () => clearTimeout(timeoutId);
  }, [locations, activeView, searchRadius]);

  return {
    processedLocations
  };
};
