
import { useState, useCallback, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface UsePhotoPointsMapContainerProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onLocationUpdate?: (latitude: number, longitude: number) => void;
}

export function usePhotoPointsMapContainer({
  userLocation,
  locations,
  certifiedLocations,
  calculatedLocations, 
  activeView,
  searchRadius,
  onLocationClick,
  onLocationUpdate
}: UsePhotoPointsMapContainerProps) {
  const [mapReady, setMapReady] = useState(false);
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const touchTimer = useRef<NodeJS.Timeout | null>(null);
  const touchMoved = useRef(false);
  const isMobile = useIsMobile();
  
  // Calculate mapCenter and zoom based on current user location
  const mapCenter = userLocation ? [userLocation.latitude, userLocation.longitude] as [number, number] : 
    [35.6762, 139.6503] as [number, number]; // Default to Tokyo if no location
  
  const initialZoom = userLocation ? (isMobile ? 10 : 11) : 6;
  const mapContainerHeight = isMobile ? '350px' : '500px';
    
  // Filter locations to avoid overloading the map
  const optimizedLocations = locations.slice(0, 100); // Limit to 100 markers for performance
  
  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);
  
  const handleLocationClicked = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    }
  }, [onLocationClick]);
  
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (onLocationUpdate) {
      onLocationUpdate(lat, lng);
    }
  }, [onLocationUpdate]);
  
  // Marker hover handling for desktop
  const handleHover = useCallback((id: string | null) => {
    setHoveredLocationId(id);
  }, []);
  
  // Touch handling for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent<Element>, id: string) => {
    touchMoved.current = false;
    
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
    }
    
    touchTimer.current = setTimeout(() => {
      if (!touchMoved.current) {
        setHoveredLocationId(id);
      }
    }, 500); // Long press duration
  }, []);
  
  const handleTouchMove = useCallback((e: React.TouchEvent<Element>) => {
    touchMoved.current = true;
    
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
    
    setHoveredLocationId(null);
  }, []);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent<Element>) => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
  }, []);
  
  // Get location button
  const handleGetLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (onLocationUpdate) {
            onLocationUpdate(latitude, longitude);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    }
  }, [onLocationUpdate]);
  
  // Toggle legend visibility
  const handleLegendToggle = useCallback(() => {
    setShowLegend(prev => !prev);
  }, []);
  
  return {
    mapContainerHeight,
    mapReady,
    handleMapReady,
    optimizedLocations,
    mapCenter,
    initialZoom,
    hoveredLocationId,
    showLegend,
    handleHover,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    handleMapClick,
    handleLocationClicked,
    handleGetLocation,
    handleLegendToggle,
    isMobile
  };
}
