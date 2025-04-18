import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useIsMobile } from '@/hooks/use-mobile';
import useMapMarkers from '@/hooks/map/useMapMarkers';
import { usePhotoPointsMap } from '@/hooks/photoPoints/usePhotoPointsMap';

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

const useLocationUpdateThrottle = () => {
  const isThrottled = useRef(false);
  const throttleDuration = 1000; // 1 second
  
  const throttle = useCallback((callback: Function) => {
    if (isThrottled.current) return false;
    
    isThrottled.current = true;
    setTimeout(() => {
      isThrottled.current = false;
    }, throttleDuration);
    
    callback();
    return true;
  }, []);
  
  return throttle;
};

export const usePhotoPointsMapContainer = ({
  userLocation,
  locations,
  certifiedLocations,
  calculatedLocations,
  activeView,
  searchRadius,
  onLocationClick,
  onLocationUpdate
}: UsePhotoPointsMapContainerProps) => {
  const isMobile = useIsMobile();
  const [mapContainerHeight, setMapContainerHeight] = useState('450px');
  const [legendOpen, setLegendOpen] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const throttleLocationUpdate = useLocationUpdateThrottle();
  
  const { 
    hoveredLocationId, 
    handleHover,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove
  } = useMapMarkers();
  
  const locationsToShow = useMemo(() => {
    if (activeView === 'certified') {
      return certifiedLocations;
    } else {
      return calculatedLocations.concat(
        certifiedLocations.filter(certLoc => 
          !calculatedLocations.some(calcLoc => 
            calcLoc.latitude === certLoc.latitude && 
            calcLoc.longitude === certLoc.longitude
          )
        )
      );
    }
  }, [activeView, certifiedLocations, calculatedLocations]);
  
  const { 
    mapReady,
    handleMapReady,
    handleLocationClick,
    validLocations,
    mapCenter,
    initialZoom,
    certifiedLocationsLoaded,
    certifiedLocationsLoading
  } = usePhotoPointsMap({
    userLocation,
    locations: locationsToShow,
    searchRadius,
    activeView
  });
  
  const locationCacheKey = useMemo(() => {
    return `${validLocations.length}-${isMobile}-${activeView}`;
  }, [validLocations.length, isMobile, activeView]);
  
  const optimizedLocations = useMemo(() => {
    if (!validLocations || validLocations.length === 0) {
      return [];
    }

    if (!isMobile) {
      return validLocations;
    }
    
    if (validLocations.length <= 30) {
      return validLocations;
    }
    
    const certified = validLocations.filter(loc => 
      loc.isDarkSkyReserve || loc.certification
    );
    
    const nonCertifiedSamplingRate = activeView === 'certified' ? 5 : 3;
    
    const nonCertified = validLocations
      .filter(loc => !loc.isDarkSkyReserve && !loc.certification)
      .filter((_, index) => index % nonCertifiedSamplingRate === 0)
      .slice(0, 40);
    
    return [...certified, ...nonCertified];
  }, [locationCacheKey]);
  
  useEffect(() => {
    const adjustHeight = () => {
      if (isMobile) {
        setMapContainerHeight('calc(70vh - 200px)');
      } else {
        setMapContainerHeight('450px');
      }
    };
    
    adjustHeight();
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, [isMobile]);
  
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (onLocationUpdate && !isUpdatingLocation) {
      throttleLocationUpdate(() => {
        setIsUpdatingLocation(true);
        
        onLocationUpdate(lat, lng);
        
        setTimeout(() => setIsUpdatingLocation(false), 1000);
      });
    }
  }, [onLocationUpdate, isUpdatingLocation, throttleLocationUpdate]);
  
  const handleLocationClicked = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    } else {
      handleLocationClick(location);
    }
  }, [onLocationClick, handleLocationClick]);
  
  const handleGetLocation = useCallback(() => {
    if (onLocationUpdate && navigator.geolocation && !isUpdatingLocation) {
      throttleLocationUpdate(() => {
        setIsUpdatingLocation(true);
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            onLocationUpdate(latitude, longitude);
            
            setTimeout(() => setIsUpdatingLocation(false), 1000);
          },
          (error) => {
            console.error("Error getting location:", error.message);
            setIsUpdatingLocation(false);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      });
    }
  }, [onLocationUpdate, isUpdatingLocation, throttleLocationUpdate]);
  
  const handleLegendToggle = useCallback((isOpen: boolean) => {
    setLegendOpen(isOpen);
  }, []);

  return {
    mapContainerHeight,
    legendOpen,
    mapReady,
    handleMapReady,
    optimizedLocations,
    mapCenter,
    initialZoom,
    hoveredLocationId,
    handleHover,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    handleMapClick,
    handleLocationClicked,
    handleGetLocation,
    handleLegendToggle,
    isMobile,
    certifiedLocationsLoaded,
    certifiedLocationsLoading
  };
};
