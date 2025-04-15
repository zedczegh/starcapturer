
import { useState, useCallback, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useMapLocations } from './useMapLocations';
import { useMapUtils } from './useMapUtils';
import { addLocationToStore } from '@/services/calculatedLocationsService';
import { useCertifiedLocationsLoader } from './useCertifiedLocationsLoader';

interface UsePhotoPointsMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
}

export const usePhotoPointsMap = ({
  userLocation,
  locations,
  searchRadius,
  activeView
}: UsePhotoPointsMapProps) => {
  const [mapReady, setMapReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SharedAstroSpot | null>(null);
  
  // Only load certified locations when in certified view
  const shouldLoadCertified = activeView === 'certified';
  
  // Use our certified locations loader with conditional loading
  const { 
    certifiedLocations: allCertifiedLocations, 
    isLoading: certifiedLocationsLoading,
    loadingProgress 
  } = useCertifiedLocationsLoader(shouldLoadCertified);
  
  const [certifiedLocationsLoaded, setCertifiedLocationsLoaded] = useState(false);
  
  // Store all certified locations for persistence, but only when in certified view
  useEffect(() => {
    if (shouldLoadCertified && allCertifiedLocations.length > 0) {
      console.log(`Storing ${allCertifiedLocations.length} certified locations in persistent storage`);
      allCertifiedLocations.forEach(location => {
        if (location.isDarkSkyReserve || location.certification) {
          addLocationToStore(location);
        }
      });
      setCertifiedLocationsLoaded(true);
    }
  }, [allCertifiedLocations, shouldLoadCertified]);
  
  // Use map utilities
  const { getZoomLevel, handleLocationClick } = useMapUtils();
  
  // Combine locations - for certified view, always include all certified locations regardless of radius
  const combinedLocations = useCallback(() => {
    if (activeView === 'certified') {
      // For certified view, always use all certified locations regardless of distance
      if (allCertifiedLocations.length > 0) {
        return allCertifiedLocations;
      }
    }
    
    // For calculated view or if no certified locations are loaded yet
    return locations;
  }, [locations, allCertifiedLocations, activeView]);
  
  // Use the location processing hook
  const { processedLocations } = useMapLocations({
    userLocation,
    locations: combinedLocations(),
    searchRadius,
    activeView,
    mapReady
  });

  // Calculate map center coordinates
  const mapCenter: [number, number] = userLocation 
    ? [userLocation.latitude, userLocation.longitude]
    : processedLocations.length > 0
      ? [processedLocations[0].latitude, processedLocations[0].longitude]
      : [39.9042, 116.4074]; // Default center (Beijing)

  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  const initialZoom = getZoomLevel(searchRadius);

  return {
    mapReady,
    handleMapReady,
    selectedLocation,
    handleLocationClick,
    validLocations: processedLocations,
    mapCenter,
    initialZoom,
    certifiedLocationsLoaded,
    certifiedLocationsLoading: certifiedLocationsLoading && shouldLoadCertified,
    loadingProgress,
    allCertifiedLocationsCount: allCertifiedLocations.length
  };
};

export default usePhotoPointsMap;
