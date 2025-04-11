
import { useState, useCallback, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useMapLocations } from './useMapLocations';
import { useMapUtils } from './useMapUtils';
import { useMapZoom } from './useMapZoom';
import { useCertifiedLocationsLoader } from './useCertifiedLocationsLoader';
import { addLocationToStore } from '@/services/calculatedLocationsService';

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
  const previousLocationRef = useRef<{latitude: number, longitude: number} | null>(null);
  
  // Use refactored hooks
  const { getZoomLevel } = useMapZoom();
  const { handleLocationClick } = useMapUtils();
  const { 
    allCertifiedLocations, 
    certifiedLocationsLoaded, 
    loadInitialCertifiedLocations, 
    refreshCertifiedLocations 
  } = useCertifiedLocationsLoader();

  // Load certified locations on initial render
  useEffect(() => {
    loadInitialCertifiedLocations(userLocation);
  }, [loadInitialCertifiedLocations]);
  
  // Refresh certified locations when map is ready and user location changes significantly
  useEffect(() => {
    if (mapReady && userLocation) {
      refreshCertifiedLocations(userLocation);
    }
  }, [mapReady, userLocation, refreshCertifiedLocations]);
  
  // Track location changes
  useEffect(() => {
    if (!userLocation) return;
    
    // Check if location has changed significantly
    const locationChanged = !previousLocationRef.current ||
      Math.abs(previousLocationRef.current.latitude - userLocation.latitude) > 0.01 ||
      Math.abs(previousLocationRef.current.longitude - userLocation.longitude) > 0.01;
    
    if (locationChanged) {
      previousLocationRef.current = userLocation;
    }
  }, [userLocation]);
  
  // Combine locations - for certified view, always include all certified locations
  const combinedLocations = useCallback(() => {
    if (activeView === 'certified' && allCertifiedLocations.length > 0) {
      // Make a map to remove any duplicates
      const locMap = new Map<string, SharedAstroSpot>();
      
      // First add all certified locations from global list
      allCertifiedLocations.forEach(loc => {
        if (!loc.latitude || !loc.longitude) return;
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        locMap.set(key, loc);
      });
      
      // Then add locations from main locations array
      locations.forEach(loc => {
        if (!loc.latitude || !loc.longitude) return;
        
        // For certified view, only add locations that are certified
        if (activeView === 'certified' && !(loc.isDarkSkyReserve || loc.certification)) {
          return;
        }
        
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        // Prefer locations from the main array as they might have more up-to-date data
        locMap.set(key, loc);
      });
      
      // Add specific East Asian dark sky locations
      addEastAsianDarkSkyLocations(locMap);
      
      return Array.from(locMap.values());
    }
    
    return locations;
  }, [locations, allCertifiedLocations, activeView]);
  
  // Helper to add East Asian dark sky locations
  const addEastAsianDarkSkyLocations = (locMap: Map<string, SharedAstroSpot>) => {
    const eastAsianLocations = [
      // Shenzhen Xichong Dark Sky Community
      {
        id: 'shenzhen-xichong',
        name: 'Shenzhen Xichong Dark Sky Community',
        latitude: 22.5808,
        longitude: 114.5034,
        isDarkSkyReserve: true,
        certification: 'Dark Sky Community - International Dark Sky Association',
        timestamp: new Date().toISOString()
      },
      // Yeongyang Firefly Dark Sky Park
      {
        id: 'yeongyang-firefly',
        name: 'Yeongyang Firefly Eco Park Dark Sky Park',
        latitude: 36.6552,
        longitude: 129.1122,
        isDarkSkyReserve: true,
        certification: 'Dark Sky Park - International Dark Sky Association',
        timestamp: new Date().toISOString()
      },
      // Jindo Dark Sky Park
      {
        id: 'jindo-dark-sky',
        name: 'Jindo Dark Sky Park',
        latitude: 34.4763,
        longitude: 126.2631,
        isDarkSkyReserve: true,
        certification: 'Dark Sky Park - International Dark Sky Association',
        timestamp: new Date().toISOString()
      },
      // Yaeyama Islands Dark Sky Reserve
      {
        id: 'yaeyama-dark-sky',
        name: 'Yaeyama Islands International Dark Sky Reserve',
        latitude: 24.4667,
        longitude: 124.2167,
        isDarkSkyReserve: true,
        certification: 'Dark Sky Reserve - International Dark Sky Association',
        timestamp: new Date().toISOString()
      },
      // Iriomote-Ishigaki Dark Sky Reserve
      {
        id: 'iriomote-ishigaki',
        name: 'Iriomote-Ishigaki National Park Dark Sky Reserve',
        latitude: 24.3423,
        longitude: 124.1546,
        isDarkSkyReserve: true,
        certification: 'Dark Sky Reserve - International Dark Sky Association',
        timestamp: new Date().toISOString()
      },
      // Himawari Farm Dark Sky Park
      {
        id: 'himawari-farm',
        name: 'Himawari Farm Dark Sky Park',
        latitude: 42.9824,
        longitude: 140.9946,
        isDarkSkyReserve: true,
        certification: 'Dark Sky Park - International Dark Sky Association',
        timestamp: new Date().toISOString()
      }
    ];
    
    // Add East Asian locations to the map if they don't exist yet
    eastAsianLocations.forEach(loc => {
      const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
      if (!locMap.has(key)) {
        locMap.set(key, loc as SharedAstroSpot);
        // Also store in global location store
        addLocationToStore(loc as SharedAstroSpot);
      }
    });
  };
  
  // Use the location processing hook with activeView filter
  const { processedLocations } = useMapLocations({
    userLocation,
    // Filter locations for certified view
    locations: activeView === 'certified' 
      ? combinedLocations().filter(loc => loc.isDarkSkyReserve || loc.certification)
      : combinedLocations(),
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
    validLocations: activeView === 'certified'
      ? processedLocations.filter(loc => loc.isDarkSkyReserve || loc.certification)
      : processedLocations,
    mapCenter,
    initialZoom,
    certifiedLocationsLoaded,
    allCertifiedLocationsCount: allCertifiedLocations.length
  };
};
