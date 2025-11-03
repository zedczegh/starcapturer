
import { useState, useCallback, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useMapLocations, useMapUtils } from './useMapUtils';
import { addLocationToStore } from '@/services/calculatedLocationsService';
import { useCertifiedLocationsLoader } from './useCertifiedLocationsLoader';
import { useQueryClient } from '@tanstack/react-query';

interface UsePhotoPointsMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated' | 'obscura' | 'mountains';
}

export const usePhotoPointsMap = ({
  userLocation,
  locations,
  searchRadius,
  activeView
}: UsePhotoPointsMapProps) => {
  const [mapReady, setMapReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SharedAstroSpot | null>(null);
  const queryClient = useQueryClient();
  const visibilityListenerRef = useRef<boolean>(false);
  
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
  
  // Combine locations - filter by active view
  const combinedLocations = useCallback(() => {
    console.log(`Processing locations - activeView: ${activeView}, certified: ${allCertifiedLocations.length}, regular: ${locations?.length || 0}`);
    
    // Create a Map to store unique locations
    const locationMap = new Map<string, SharedAstroSpot>();
    
    if (activeView === 'certified') {
      // Only show dark sky certified locations (not obscura or mountains)
      allCertifiedLocations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const isDarkSky = (loc.isDarkSkyReserve || loc.certification) && 
            !loc.certification?.toLowerCase().includes('atlas obscura') &&
            !loc.certification?.toLowerCase().includes('natural mountain');
          
          if (isDarkSky) {
            const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
            locationMap.set(key, loc);
          }
        }
      });
    } else if (activeView === 'obscura') {
      // Only show obscura locations
      if (Array.isArray(locations)) {
        locations.forEach(loc => {
          if (loc.latitude && loc.longitude) {
            const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
            locationMap.set(key, loc);
          }
        });
      }
    } else if (activeView === 'mountains') {
      // Only show mountain locations
      if (Array.isArray(locations)) {
        locations.forEach(loc => {
          if (loc.latitude && loc.longitude) {
            const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
            locationMap.set(key, loc);
          }
        });
      }
      console.log(`Mountains view: Added ${locationMap.size} mountain locations to map`);
    } else if (activeView === 'calculated') {
      // Only show calculated (non-certified) locations
      if (Array.isArray(locations)) {
        locations.forEach(loc => {
          if (loc.latitude && loc.longitude && !loc.isDarkSkyReserve && !loc.certification) {
            const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
            locationMap.set(key, loc);
          }
        });
      }
    }
    
    const result = Array.from(locationMap.values());
    console.log(`Combined locations for '${activeView}' view. Total: ${result.length}`);
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
  
  // Refresh markers when page becomes visible (tab change or return to page)
  useEffect(() => {
    if (visibilityListenerRef.current) return; // Prevent duplicate listeners
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Photo points page became visible, invalidating queries...');
        // Invalidate queries to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['certified-locations'] });
        queryClient.invalidateQueries({ queryKey: ['calculated-locations'] });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    visibilityListenerRef.current = true;
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      visibilityListenerRef.current = false;
    };
  }, [queryClient]);
  
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
