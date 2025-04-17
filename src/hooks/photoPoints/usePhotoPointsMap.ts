import { useState, useCallback, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useMapLocations, useMapUtils } from './useMapUtils';
import { addLocationToStore } from '@/services/calculatedLocationsService';
import { useCertifiedLocationsLoader } from './useCertifiedLocationsLoader';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

declare global {
  interface Window {
    leafletMap?: any;
  }
}

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
  const { t } = useLanguage();
  const [mapReady, setMapReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SharedAstroSpot | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const shouldLoadCertified = true;
  
  const { 
    certifiedLocations: allCertifiedLocations, 
    isLoading: certifiedLocationsLoading,
    loadingProgress,
    refreshLocations: refreshCertifiedLocations
  } = useCertifiedLocationsLoader(shouldLoadCertified);
  
  const [certifiedLocationsLoaded, setCertifiedLocationsLoaded] = useState(false);
  
  useEffect(() => {
    if (allCertifiedLocations.length > 0) {
      console.log(`Storing ${allCertifiedLocations.length} certified locations in persistent storage`);
      allCertifiedLocations.forEach(location => {
        if (location.isDarkSkyReserve || location.certification) {
          addLocationToStore(location);
        }
      });
      setCertifiedLocationsLoaded(true);
    } else if (mapReady && !certifiedLocationsLoading && retryCount < 3) {
      console.log("No certified locations loaded, retrying...");
      setTimeout(() => {
        refreshCertifiedLocations();
        setRetryCount(prev => prev + 1);
      }, 2000);
    }
  }, [allCertifiedLocations, mapReady, certifiedLocationsLoading, refreshCertifiedLocations, retryCount]);
  
  const { getZoomLevel, handleLocationClick } = useMapUtils();
  
  useEffect(() => {
    console.log(`Current state - activeView: ${activeView}, certified: ${allCertifiedLocations.length}, calculated: ${locations.length}`);
  }, [activeView, allCertifiedLocations.length, locations.length]);
  
  const combinedLocations = useCallback(() => {
    console.log(`Processing locations - activeView: ${activeView}, certified: ${allCertifiedLocations.length}, regular: ${locations?.length || 0}`);
    
    const locationMap = new Map<string, SharedAstroSpot>();
    
    allCertifiedLocations.forEach(loc => {
      if (loc.latitude && loc.longitude) {
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        locationMap.set(key, loc);
      }
    });
    
    if (activeView === 'calculated') {
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
    
    const result = Array.from(locationMap.values());
    console.log(`Combined ${allCertifiedLocations.length} certified and ${locations?.length || 0} calculated locations for map display. Total: ${result.length}`);
    
    if (activeView === 'calculated' && allCertifiedLocations.length > 0 && locations.length === 0 && mapReady) {
      setTimeout(() => {
        toast.info(t(
          "Use the search radius control to find calculated spots",
          "使用搜索半径控制找到计算点"
        ));
      }, 1000);
    }
    
    return result;
  }, [locations, allCertifiedLocations, activeView, mapReady, t]);
  
  const { processedLocations } = useMapLocations({
    userLocation,
    locations: combinedLocations(),
    searchRadius,
    activeView,
    mapReady
  });

  console.log(`Processed locations: ${processedLocations.length}`);

  const mapCenter: [number, number] = userLocation 
    ? [userLocation.latitude, userLocation.longitude]
    : [35.8617, 104.1954];

  const handleMapReady = useCallback(() => {
    console.log("Map ready signal received");
    setMapReady(true);
    
    if (window.leafletMap) {
      console.log("Global leaflet map instance available");
    }
  }, []);

  const initialZoom = userLocation ? 6 : 4;

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
