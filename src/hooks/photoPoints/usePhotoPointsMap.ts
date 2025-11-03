
import { useState, useCallback, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useMapUtils } from './useMapUtils';

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
  
  // Track previous activeView to detect changes
  const prevActiveViewRef = useRef(activeView);
  const [displayLocations, setDisplayLocations] = useState<SharedAstroSpot[]>([]);
  
  // Update display locations immediately when activeView or locations change
  useEffect(() => {
    const viewChanged = prevActiveViewRef.current !== activeView;
    if (viewChanged) {
      console.log(`Tab switched from ${prevActiveViewRef.current} to ${activeView}`);
      prevActiveViewRef.current = activeView;
    }
    
    // Use locations prop directly - it's already filtered by PhotoPointsView
    if (Array.isArray(locations) && locations.length > 0) {
      console.log(`Setting ${locations.length} locations for ${activeView} view`);
      setDisplayLocations(locations);
    } else {
      setDisplayLocations([]);
    }
  }, [locations, activeView]);
  
  // Use map utilities
  const { getZoomLevel, handleLocationClick } = useMapUtils();

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
  
  console.log(`usePhotoPointsMap: displayLocations=${displayLocations.length}, activeView=${activeView}`);
  
  return {
    mapReady,
    handleMapReady,
    selectedLocation,
    handleLocationClick,
    validLocations: displayLocations,
    mapCenter,
    initialZoom,
    certifiedLocationsLoaded: true,
    certifiedLocationsLoading: false
  };
};

export default usePhotoPointsMap;
