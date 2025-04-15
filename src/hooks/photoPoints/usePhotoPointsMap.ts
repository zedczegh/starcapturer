
import { useState, useCallback, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useMapLocations } from './useMapLocations';
import { addLocationToStore } from '@/services/calculatedLocationsService';
import { useCertifiedLocationsLoader } from './useCertifiedLocationsLoader';
import { useMapUtils } from './useMapUtils';

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
  
  // IMPORTANT: Always load certified locations regardless of view
  const shouldLoadCertified = true; // Always load certified locations
  
  // Use our certified locations loader with always-on loading
  const { 
    certifiedLocations: allCertifiedLocations, 
    isLoading: certifiedLocationsLoading,
    loadingProgress 
  } = useCertifiedLocationsLoader(shouldLoadCertified);
  
  const [certifiedLocationsLoaded, setCertifiedLocationsLoaded] = useState(false);
  
  // Store all certified locations for persistence
  useEffect(() => {
    if (allCertifiedLocations.length > 0) {
      console.log(`Storing ${allCertifiedLocations.length} certified locations in persistent storage`);
      allCertifiedLocations.forEach(location => {
        if (location.isDarkSkyReserve || location.certification) {
          addLocationToStore(location);
        }
      });
      setCertifiedLocationsLoaded(true);
    }
  }, [allCertifiedLocations]);
  
  // Use map utilities
  const { getZoomLevel, handleLocationClick } = useMapUtils();
  
  // Debug logs to help track the issue
  useEffect(() => {
    console.log(`usePhotoPointsMap - Locations count: ${locations.length}, Active view: ${activeView}`);
    console.log(`usePhotoPointsMap - Certified locations: ${allCertifiedLocations.length}`);
  }, [locations.length, activeView, allCertifiedLocations.length]);
  
  // Combine locations
  const combinedLocations = useCallback(() => {
    // For certified view, only show certified locations
    if (activeView === 'certified') {
      return allCertifiedLocations;
    }
    
    // For calculated view, show both types but prevent duplicates
    const allLocations = [...locations];
    
    // If we have certified locations that aren't in the main locations array, add them
    if (allCertifiedLocations.length > 0) {
      const locationMap = new Map<string, SharedAstroSpot>();
      
      // First add all provided locations
      allLocations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          locationMap.set(key, loc);
        }
      });
      
      // Then add certified locations that aren't already included
      allCertifiedLocations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          if (!locationMap.has(key)) {
            locationMap.set(key, loc);
            allLocations.push(loc);
          }
        }
      });
    }
    
    console.log(`combinedLocations - Returning ${allLocations.length} locations for ${activeView} view`);
    return allLocations;
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
    certifiedLocationsLoading: certifiedLocationsLoading,
    loadingProgress,
    allCertifiedLocationsCount: allCertifiedLocations.length
  };
};

export default usePhotoPointsMap;
