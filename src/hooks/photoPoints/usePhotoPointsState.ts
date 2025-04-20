import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { getCurrentPosition } from '@/utils/geolocationUtils';

export const usePhotoPointsState = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  
  // Changed initial view to 'calculated'
  const [activeView, setActiveView] = useState<'certified' | 'calculated'>('calculated');
  
  // Set showMap to true by default
  const [showMap, setShowMap] = useState(true);
  
  // For initializing states
  const [initialLoad, setInitialLoad] = useState(true);
  const [autoLocationRequested, setAutoLocationRequested] = useState(false);
  
  // For location tracking
  const [effectiveLocation, setEffectiveLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const { 
    coords: currentPosition, 
    loading: locationLoading, 
    getPosition: requestGeolocation
  } = useGeolocation();
  
  // Update effective location when current position changes
  useEffect(() => {
    if (currentPosition) {
      setEffectiveLocation({
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude
      });
      
      console.log(`Location updated from geolocation: ${currentPosition.latitude}, ${currentPosition.longitude}`);
    }
  }, [currentPosition]);

  // Auto-request location when the component mounts
  useEffect(() => {
    if (!effectiveLocation && !autoLocationRequested && initialLoad) {
      setAutoLocationRequested(true);
      
      getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setEffectiveLocation({
            latitude,
            longitude
          });
          console.log("Auto-located user at:", latitude, longitude);
        },
        (error) => {
          console.error("Error auto-locating user:", error);
          // Silent failure - we don't want to show an error toast for auto-location
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, [effectiveLocation, autoLocationRequested, initialLoad]);

  // Default calculated search radius set to 500km exactly as requested
  const [calculatedSearchRadius, setCalculatedSearchRadius] = useState(500);
  
  // Determine the current search radius based on active view
  const currentSearchRadius = activeView === 'certified' ? 20000 : calculatedSearchRadius;
  
  // Handle search radius slider change
  const handleRadiusChange = useCallback((value: number) => {
    setCalculatedSearchRadius(value);
  }, []);
  
  // Update location without auto-refresh
  const handleLocationUpdate = useCallback((latitude: number, longitude: number) => {
    if (!isFinite(latitude) || !isFinite(longitude)) {
      toast.error(t("Invalid location coordinates", "无效的位置坐标"));
      return;
    }
    
    setEffectiveLocation({
      latitude,
      longitude
    });
    
    console.log(`Location updated to: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  }, [t]);
  
  // Reset location to user's current position with improved reliability
  const handleResetLocation = useCallback(() => {
    // First set a loading state if needed
    // Then use our enhanced getCurrentPosition utility
    getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setEffectiveLocation({
          latitude,
          longitude
        });
        
        console.log(`Location reset to current position: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        
        // Try to center map if it exists
        try {
          const leafletMap = (window as any).leafletMap;
          if (leafletMap) {
            leafletMap.setView([latitude, longitude], 12, { 
              animate: true,
              duration: 1.5 
            });
            console.log("Map centered on reset location");
          }
        } catch (e) {
          console.error("Could not center map:", e);
        }
      },
      (error) => {
        console.error("Error resetting location:", error);
        toast.error(t("Unable to get your location", "无法获取您的位置"));
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0,
        language
      }
    );
  }, [t, language]);
  
  // Toggle between certified and calculated views
  const handleViewChange = useCallback((view: 'certified' | 'calculated') => {
    setActiveView(view);
  }, []);
  
  // Toggle between map and list views
  const toggleMapView = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);
  
  // Set initial load flag to false after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  
  return {
    activeView,
    showMap,
    initialLoad,
    locationLoading,
    effectiveLocation,
    calculatedSearchRadius,
    currentSearchRadius,
    handleRadiusChange,
    handleViewChange,
    handleLocationUpdate,
    handleResetLocation,
    toggleMapView
  };
};

export default usePhotoPointsState;
