import { useState, useCallback, useEffect, useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useIsMobile } from '@/hooks/use-mobile';
import useMapMarkers from '@/hooks/map/useMapMarkers';
import { usePhotoPointsMap } from '@/hooks/photoPoints/usePhotoPointsMap';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCurrentPosition } from '@/utils/geolocationUtils';

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
  const { t, language } = useLanguage();
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
  
  const locationsToShow = useMemo(() => {
    if (activeView === 'certified') {
      return certifiedLocations;
    } else {
      return [...calculatedLocations, ...(activeView === 'calculated' ? [] : certifiedLocations)];
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
  
  const optimizedLocations = useMemo(() => {
    if (!validLocations || validLocations.length === 0) {
      console.log("No valid locations to display");
      return [];
    }

    if (!isMobile) {
      console.log(`Displaying all ${validLocations.length} locations (desktop)`);
      return validLocations;
    }
    
    if (validLocations.length <= 30) {
      console.log(`Displaying all ${validLocations.length} locations (mobile, under limit)`);
      return validLocations;
    }
    
    const certified = validLocations.filter(loc => 
      loc.isDarkSkyReserve || loc.certification
    );
    
    const nonCertified = validLocations
      .filter(loc => !loc.isDarkSkyReserve && !loc.certification)
      .filter((_, index) => index % (activeView === 'certified' ? 4 : 2) === 0)
      .slice(0, 50);
    
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
  
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (onLocationUpdate && !isUpdatingLocation) {
      setIsUpdatingLocation(true);
      console.log("Setting new location from map click:", lat, lng);
      
      onLocationUpdate(lat, lng);
      
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
    if (!onLocationUpdate || isUpdatingLocation) return;
    
    setIsUpdatingLocation(true);
    
    getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        onLocationUpdate(latitude, longitude);
        console.log("Got user position:", latitude, longitude);
        
        try {
          const leafletMap = (window as any).leafletMap;
          if (leafletMap) {
            leafletMap.setView([latitude, longitude], 12, { 
              animate: true,
              duration: 1.5 
            });
            console.log("Map centered on current location");
          }
        } catch (e) {
          console.error("Could not center map:", e);
        }
        
        setTimeout(() => {
          setIsUpdatingLocation(false);
        }, 1000);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error(t("Could not get your location", "无法获取您的位置"));
        setIsUpdatingLocation(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0,
        language
      }
    );
  }, [onLocationUpdate, isUpdatingLocation, t, language]);
  
  const handleLegendToggle = useCallback((isOpen: boolean) => {
    setLegendOpen(isOpen);
  }, []);

  return {
    mapContainerHeight,
    legendOpen,
    mapReady,
    handleMapReady,
    optimizedLocations: validLocations,
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
