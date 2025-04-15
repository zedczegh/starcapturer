
import { useState, useCallback, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useMapLocations, useMapUtils } from './useMapUtils';
import { addLocationToStore } from '@/services/calculatedLocationsService';
import { useCertifiedLocationsLoader } from './useCertifiedLocationsLoader';

interface UsePhotoPointsMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  preventAutoZoom?: boolean;
  mapReady?: boolean;
}

export const usePhotoPointsMap = ({
  userLocation,
  locations,
  searchRadius,
  activeView,
  preventAutoZoom = true,
  mapReady: externalMapReady = false
}: UsePhotoPointsMapProps) => {
  const [mapReady, setMapReady] = useState(externalMapReady);
  const [selectedLocation, setSelectedLocation] = useState<SharedAstroSpot | null>(null);
  const initialCenterRef = useRef<[number, number] | null>(null);
  const initialZoomRef = useRef<number | null>(null);
  
  // IMPORTANT: Always load certified locations regardless of view
  const shouldLoadCertified = true; // Changed from conditional to always true
  
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
  
  // Combine locations - always include all certified locations regardless of view
  const combinedLocations = useCallback(() => {
    // Always include certified locations
    if (allCertifiedLocations.length > 0) {
      // If in certified view, only show certified locations
      if (activeView === 'certified') {
        return allCertifiedLocations;
      } 
      
      // If in calculated view, combine all locations but prioritize certified ones
      const locationMap = new Map<string, SharedAstroSpot>();
      
      // First add all certified locations
      allCertifiedLocations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          locationMap.set(key, loc);
        }
      });
      
      // Then add calculated locations without overriding certified ones
      locations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          if (!locationMap.has(key)) {
            locationMap.set(key, loc);
          }
        }
      });
      
      return Array.from(locationMap.values());
    }
    
    // Fallback to provided locations if certified locations aren't loaded yet
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

  // Calculate map center coordinates but only once on initial load
  // or when forced (not on radius changes)
  const mapCenter = useCallback((): [number, number] => {
    if (initialCenterRef.current && preventAutoZoom) {
      return initialCenterRef.current;
    }
    
    const newCenter: [number, number] = userLocation 
      ? [userLocation.latitude, userLocation.longitude]
      : processedLocations.length > 0
        ? [processedLocations[0].latitude, processedLocations[0].longitude]
        : [39.9042, 116.4074]; // Default center (Beijing)
    
    initialCenterRef.current = newCenter;
    return newCenter;
  }, [userLocation, processedLocations, preventAutoZoom]);

  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  // Get initial zoom but don't change it on searchRadius updates if preventAutoZoom is true
  const getInitialZoom = useCallback(() => {
    if (initialZoomRef.current !== null && preventAutoZoom) {
      return initialZoomRef.current;
    }
    
    const zoom = getZoomLevel(searchRadius);
    initialZoomRef.current = zoom;
    return zoom;
  }, [getZoomLevel, searchRadius, preventAutoZoom]);

  return {
    mapReady,
    handleMapReady,
    selectedLocation,
    handleLocationClick,
    validLocations: processedLocations,
    mapCenter: mapCenter(),
    initialZoom: getInitialZoom(),
    certifiedLocationsLoaded,
    certifiedLocationsLoading,
    loadingProgress,
    allCertifiedLocationsCount: allCertifiedLocations.length
  };
};

export default usePhotoPointsMap;
