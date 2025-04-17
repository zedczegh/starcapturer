import { useState, useCallback, useEffect, useMemo } from 'react';
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
  
  const { 
    hoveredLocationId, 
    handleHover,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove
  } = useMapMarkers();
  
  // Determine which locations to display based on active view
  const locationsToShow = useMemo(() => {
    if (activeView === 'certified') {
      return certifiedLocations;
    } else {
      // For calculated view, include both certified and calculated locations
      return [...calculatedLocations, ...(activeView === 'calculated' ? [] : certifiedLocations)];
    }
  }, [activeView, certifiedLocations, calculatedLocations]);
  
  // Pass all locations to the hook, but let it handle filtering based on activeView
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
  
  // Filter out some locations on mobile for better performance
  const optimizedLocations = useMemo(() => {
    // If no valid locations available, return empty array
    if (!validLocations || validLocations.length === 0) {
      console.log("No valid locations to display");
      return [];
    }

    if (!isMobile) {
      console.log(`Displaying all ${validLocations.length} locations (desktop)`);
      return validLocations;
    }
    
    // For mobile, limit the number of displayed locations
    if (validLocations.length <= 30) {
      console.log(`Displaying all ${validLocations.length} locations (mobile, under limit)`);
      return validLocations;
    }
    
    // Always keep certified locations
    const certified = validLocations.filter(loc => 
      loc.isDarkSkyReserve || loc.certification
    );
    
    // For non-certified locations, if we have too many, sample them
    const nonCertified = validLocations
      .filter(loc => !loc.isDarkSkyReserve && !loc.certification)
      .filter((_, index) => index % (activeView === 'certified' ? 4 : 2) === 0)
      .slice(0, 50); // Hard limit for performance
    
    console.log(`Optimized for mobile: ${certified.length} certified + ${nonCertified.length} calculated locations`);
    return [...certified, ...nonCertified];
  }, [validLocations, isMobile, activeView]);
  
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
  
  // Debounced map click handler to prevent rapid location changes
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (onLocationUpdate && !isUpdatingLocation) {
      setIsUpdatingLocation(true);
      console.log("Setting new location from map click:", lat, lng);
      
      // Call the location update and reset the updating state after a delay
      onLocationUpdate(lat, lng);
      
      // Prevent multiple updates in quick succession
      setTimeout(() => {
        setIsUpdatingLocation(false);
      }, 1000);
    }
  }, [onLocationUpdate, isUpdatingLocation]);
  
  const handleLocationClicked = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    } else {
      handleLocationClick(location);
    }
  }, [onLocationClick, handleLocationClick]);
  
  const handleGetLocation = useCallback(() => {
    if (onLocationUpdate && navigator.geolocation && !isUpdatingLocation) {
      setIsUpdatingLocation(true);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onLocationUpdate(latitude, longitude);
          console.log("Got user position:", latitude, longitude);
          
          // Reset updating state after delay
          setTimeout(() => {
            setIsUpdatingLocation(false);
          }, 1000);
        },
        (error) => {
          console.error("Error getting location:", error.message);
          setIsUpdatingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, [onLocationUpdate, isUpdatingLocation]);
  
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
