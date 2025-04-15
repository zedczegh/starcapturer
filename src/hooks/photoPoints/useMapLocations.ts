
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
    previousLocationsRef.current = locations;
    previousActiveViewRef.current = activeView;
    
    // Use a timeout to batch updates and prevent UI flashing
    const timeoutId = setTimeout(() => {
      try {
        const validLocations = filterValidLocations(locations);
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
            calculatedLocations.slice(0, 50), // Limit quantity for better performance
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
