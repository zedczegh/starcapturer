
import { useState, useCallback, useEffect, useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMapLocations } from './useMapUtils';

interface UsePhotoPointsMapContainerProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  onLocationClick: (location: SharedAstroSpot) => void;
  onLocationUpdate: (latitude: number, longitude: number) => void;
}

export function usePhotoPointsMapContainer({
  userLocation,
  locations,
  certifiedLocations,
  calculatedLocations,
  searchRadius,
  activeView,
  onLocationClick,
  onLocationUpdate
}: UsePhotoPointsMapContainerProps) {
  const isMobile = useIsMobile();
  const [mapReady, setMapReady] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  
  // Determine map center based on user location
  const mapCenter = useMemo((): [number, number] => {
    return userLocation 
      ? [userLocation.latitude, userLocation.longitude] 
      : [35.8617, 104.1954]; // Default center (China)
  }, [userLocation]);
  
  // Get appropriate zoom level based on search radius
  const initialZoom = useMemo(() => {
    if (activeView === 'certified') return 4;
    
    // Dynamic zoom based on search radius for calculated view
    const radiusToZoom: Record<number, number> = {
      100: 12,
      200: 10,
      300: 9,
      400: 8,
      500: 8,
      600: 7,
      700: 7,
      800: 6,
      900: 6,
      1000: 5
    };
    
    return radiusToZoom[searchRadius] || 8;
  }, [activeView, searchRadius]);
  
  // Process locations for display
  const { processedLocations } = useMapLocations({
    userLocation,
    locations: activeView === 'certified' ? certifiedLocations : calculatedLocations,
    searchRadius,
    activeView,
    mapReady
  });
  
  // Map click handler for updating location
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (onLocationUpdate && activeView === 'calculated') {
      onLocationUpdate(lat, lng);
    }
  }, [onLocationUpdate, activeView]);
  
  // Map ready handler
  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);
  
  // Determine container height
  const mapContainerHeight = useMemo(() => {
    return isMobile ? '50vh' : '60vh';
  }, [isMobile]);
  
  // Return combined data
  return {
    mapContainerHeight,
    legendOpen,
    mapReady,
    handleMapReady,
    optimizedLocations: processedLocations,
    mapCenter,
    initialZoom,
    handleMapClick,
    onLegendToggle: (isOpen: boolean) => setLegendOpen(isOpen)
  };
}
