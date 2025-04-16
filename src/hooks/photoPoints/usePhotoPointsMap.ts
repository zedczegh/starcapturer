
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
    if (allCertifiedLocations && allCertifiedLocations.length > 0) {
      console.log(`Storing ${allCertifiedLocations.length} certified locations in persistent storage`);
      allCertifiedLocations.forEach(location => {
        if (location && (location.isDarkSkyReserve || location.certification)) {
          addLocationToStore(location);
        }
      });
      setCertifiedLocationsLoaded(true);
    }
  }, [allCertifiedLocations]);
  
  // Use map utilities
  const { getZoomLevel, handleLocationClick } = useMapUtils();
  
  // Combine locations - always include all relevant locations based on view type
  const combinedLocations = useCallback(() => {
    console.log(`Processing locations - activeView: ${activeView}, certified: ${allCertifiedLocations?.length || 0}, regular: ${locations?.length || 0}`);
    
    // Create a Map to store unique locations
    const locationMap = new Map<string, SharedAstroSpot>();
    
    // First, add all certified locations (regardless of distance)
    if (allCertifiedLocations && allCertifiedLocations.length > 0) {
      allCertifiedLocations.forEach(loc => {
        if (loc && loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          locationMap.set(key, loc);
        }
      });
    }
    
    // For calculated view, also add non-certified locations
    if (activeView === 'calculated' && Array.isArray(locations)) {
      // Add regular locations without overriding certified ones
      locations.forEach(loc => {
        if (loc && loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          if (!locationMap.has(key)) {
            locationMap.set(key, loc);
          }
        }
      });
    }
    
    const result = Array.from(locationMap.values()).filter(Boolean);
    console.log(`Combined ${allCertifiedLocations?.length || 0} certified and ${locations?.length || 0} calculated locations for map display. Total: ${result.length}`);
    return result;
  }, [locations, allCertifiedLocations, activeView]);
  
  // Use the location processing hook without distance filtering for certified locations
  const { processedLocations } = useMapLocations({
    userLocation,
    locations: combinedLocations(),
    searchRadius,
    activeView,
    mapReady
  });

  console.log(`Processed locations: ${processedLocations?.length || 0}`);

  // Calculate map center coordinates - default to China if no location
  const mapCenter: [number, number] = userLocation 
    ? [userLocation.latitude, userLocation.longitude]
    : [35.8617, 104.1954]; // Default center (Center of China)

  const handleMapReady = useCallback(() => {
    console.log("Map ready signal received");
    setMapReady(true);
  }, []);

  // Always use a more zoomed-out initial view
  const initialZoom = 4; // Zoomed out to see large regions
  
  console.log(`usePhotoPointsMap: processedLocations=${processedLocations?.length || 0}, activeView=${activeView}, searchRadius=${searchRadius}`);
  
  return {
    mapReady,
    handleMapReady,
    selectedLocation,
    handleLocationClick,
    validLocations: processedLocations || [],
    mapCenter,
    initialZoom,
    certifiedLocationsLoaded,
    certifiedLocationsLoading: certifiedLocationsLoading,
    loadingProgress,
    allCertifiedLocationsCount: allCertifiedLocations?.length || 0
  };
};

export default usePhotoPointsMap;
