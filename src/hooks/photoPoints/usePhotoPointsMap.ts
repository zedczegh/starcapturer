
import { useState, useCallback, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useMapLocations } from './useMapLocations';
import { useMapUtils } from './useMapUtils';
import { findCertifiedLocations } from '@/services/locationSearchService';

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
  const [certifiedLocationsLoaded, setCertifiedLocationsLoaded] = useState(false);
  const [allCertifiedLocations, setAllCertifiedLocations] = useState<SharedAstroSpot[]>([]);

  // Use map utilities
  const { getZoomLevel, handleLocationClick } = useMapUtils();
  
  // Load all certified locations when map is ready
  useEffect(() => {
    const loadAllCertifiedLocations = async () => {
      if (mapReady && userLocation && !certifiedLocationsLoaded) {
        try {
          console.log("Loading all certified dark sky locations globally");
          const certifiedResults = await findCertifiedLocations(
            userLocation.latitude,
            userLocation.longitude,
            10000, // Global radius
            100 // Get up to 100 certified locations
          );
          
          if (certifiedResults.length > 0) {
            console.log(`Loaded ${certifiedResults.length} certified dark sky locations`);
            setAllCertifiedLocations(certifiedResults);
          }
          
          setCertifiedLocationsLoaded(true);
        } catch (error) {
          console.error("Error loading certified locations:", error);
        }
      }
    };
    
    loadAllCertifiedLocations();
  }, [mapReady, userLocation, certifiedLocationsLoaded]);
  
  // Combine locations - for certified view, always include all certified locations
  const combinedLocations = useCallback(() => {
    if (activeView === 'certified' && allCertifiedLocations.length > 0) {
      // Make a map to remove any duplicates
      const locMap = new Map<string, SharedAstroSpot>();
      
      // First add certified locations from main locations array
      locations.forEach(loc => {
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        locMap.set(key, loc);
      });
      
      // Then add global certified locations, not overwriting existing ones
      allCertifiedLocations.forEach(loc => {
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        if (!locMap.has(key)) {
          locMap.set(key, loc);
        }
      });
      
      return Array.from(locMap.values());
    }
    
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
    initialZoom
  };
};
