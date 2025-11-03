
import { useState, useCallback, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useMapLocations, useMapUtils } from './useMapUtils';
import { addLocationToStore } from '@/services/calculatedLocationsService';
import { useCertifiedLocationsLoader } from './useCertifiedLocationsLoader';

interface UsePhotoPointsMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated' | 'obscura';
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
  
  // Store all certified locations in localStorage for persistent access
  useEffect(() => {
    if (allCertifiedLocations.length > 0) {
      console.log(`Storing ${allCertifiedLocations.length} certified locations in localStorage`);
      try {
        localStorage.setItem('cachedCertifiedLocations', JSON.stringify(allCertifiedLocations));
        setCertifiedLocationsLoaded(true);
      } catch (err) {
        console.error("Error storing certified locations in localStorage:", err);
      }
      
      // Also store each location individually in persistent storage
      allCertifiedLocations.forEach(location => {
        if (location.isDarkSkyReserve || location.certification) {
          addLocationToStore(location);
        }
      });
    }
  }, [allCertifiedLocations]);
  
  // Use map utilities
  const { getZoomLevel, handleLocationClick } = useMapUtils();
  
  // Combine locations - always include all relevant locations
  const combinedLocations = useCallback(() => {
    console.log(`Processing locations - activeView: ${activeView}, certified: ${allCertifiedLocations.length}, regular: ${locations?.length || 0}`);
    
    // Create a Map to store unique locations
    const locationMap = new Map<string, SharedAstroSpot>();
    
    // First, add all certified locations (regardless of distance)
    allCertifiedLocations.forEach(loc => {
      if (loc.latitude && loc.longitude) {
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        locationMap.set(key, loc);
      }
    });
    
    // For calculated view, also add non-certified locations
    if (activeView === 'calculated') {
      // Add regular locations without overriding certified ones
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
    }
    
    // For obscura view, only show obscura locations (passed in locations array)
    if (activeView === 'obscura') {
      locationMap.clear();
      if (Array.isArray(locations)) {
        locations.forEach(loc => {
          if (loc.latitude && loc.longitude) {
            const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
            locationMap.set(key, loc);
          }
        });
      }
    }
    
    const result = Array.from(locationMap.values());
    console.log(`Combined ${allCertifiedLocations.length} certified and ${locations?.length || 0} calculated locations for map display. Total: ${result.length}`);
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
