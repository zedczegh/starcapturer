
import { useState, useCallback, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/types/weather';
import { useMapLocations, useMapUtils } from './useMapUtils';
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
  
  // Combine locations - always include all certified locations regardless of view
  const combinedLocations = useCallback(() => {
    console.log(`Processing locations - activeView: ${activeView}, certified: ${allCertifiedLocations.length}, regular: ${locations?.length || 0}`);
    
    // Always include certified locations
    if (allCertifiedLocations.length > 0) {
      // If in certified view, only show certified locations
      if (activeView === 'certified') {
        console.log(`Returning ${allCertifiedLocations.length} certified locations for map display`);
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
      if (Array.isArray(locations)) {
        locations.forEach(loc => {
          if (loc.latitude && loc.longitude) {
            const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
            if (!locationMap.has(key)) {
              locationMap.set(key, loc);
            }
          }
        });
      }
      
      const result = Array.from(locationMap.values());
      console.log(`Combined ${allCertifiedLocations.length} certified and ${locations?.length || 0} calculated locations for map display. Total: ${result.length}`);
      return result;
    }
    
    // Fallback to provided locations if certified locations aren't loaded yet
    console.log(`Using ${locations?.length || 0} fallback locations for map display`);
    return Array.isArray(locations) ? locations : [];
  }, [locations, allCertifiedLocations, activeView]);
  
  // Use the location processing hook
  const { processedLocations } = useMapLocations({
    userLocation,
    locations: combinedLocations(),
    searchRadius,
    activeView,
    mapReady
  });

  console.log(`Processed locations: ${processedLocations.length}`);

  // Calculate map center coordinates
  const mapCenter: [number, number] = userLocation 
    ? [userLocation.latitude, userLocation.longitude]
    : processedLocations.length > 0
      ? [processedLocations[0].latitude, processedLocations[0].longitude]
      : [39.9042, 116.4074]; // Default center (Beijing)

  const handleMapReady = useCallback(() => {
    console.log("Map ready signal received");
    setMapReady(true);
  }, []);

  const initialZoom = getZoomLevel(searchRadius);
  
  console.log(`usePhotoPointsMap: processedLocations=${processedLocations.length}, activeView=${activeView}, searchRadius=${searchRadius}`);
  
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
