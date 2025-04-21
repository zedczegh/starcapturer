
import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { getCurrentPosition } from '@/utils/geolocationUtils';

export const usePhotoPointsState = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  
  // Prevent rapid view switching by tracking last switch time
  const lastViewSwitchTimeRef = useRef<number>(0);
  const DEBOUNCE_DELAY = 500; // ms
  
  const [activeView, setActiveView] = useState<'certified' | 'calculated'>('calculated');
  const [showMap, setShowMap] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [autoLocationRequested, setAutoLocationRequested] = useState(false);
  const [effectiveLocation, setEffectiveLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [viewSwitchInProgress, setViewSwitchInProgress] = useState(false);
  
  const { 
    coords: currentPosition, 
    loading: locationLoading, 
    getPosition: requestGeolocation,
    error: locationError
  } = useGeolocation();
  
  const [locationInitialized, setLocationInitialized] = useState(false);
  const [locationAttempted, setLocationAttempted] = useState(false);
  
  // Handle location errors
  useEffect(() => {
    if (locationError) {
      console.warn("Location error:", locationError);
      
      // Only show toast if we haven't initialized a location yet
      if (!locationInitialized) {
        toast.error(t("Unable to get your location", "无法获取您的位置"));
        
        // Use fallback location for China
        const fallbackLocation = {
          latitude: 35.8617,
          longitude: 104.1954
        };
        setEffectiveLocation(fallbackLocation);
        setLocationInitialized(true);
        console.log("Using fallback location due to error:", fallbackLocation);
      }
    }
  }, [locationError, locationInitialized, t]);
  
  useEffect(() => {
    if (currentPosition) {
      setEffectiveLocation({
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude
      });
      setLocationInitialized(true);
      console.log(`Location updated from geolocation: ${currentPosition.latitude}, ${currentPosition.longitude}`);
    }
  }, [currentPosition]);

  useEffect(() => {
    if (!effectiveLocation && !locationAttempted) {
      setLocationAttempted(true);
      
      getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setEffectiveLocation({
            latitude,
            longitude
          });
          setLocationInitialized(true);
          console.log("Auto-located user at:", latitude, longitude);
        },
        (error) => {
          console.warn("Error auto-locating user:", error);
          const defaultLocation = {
            latitude: 35.8617,
            longitude: 104.1954
          };
          setEffectiveLocation(defaultLocation);
          setLocationInitialized(true);
          console.log("Using fallback location:", defaultLocation);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, [effectiveLocation, locationAttempted]);

  const [calculatedSearchRadius, setCalculatedSearchRadius] = useState(500);
  
  const currentSearchRadius = activeView === 'certified' ? 20000 : calculatedSearchRadius;
  
  const handleRadiusChange = useCallback((value: number) => {
    setCalculatedSearchRadius(value);
  }, []);
  
  const handleLocationUpdate = useCallback((latitude: number, longitude: number) => {
    if (!isFinite(latitude) || !isFinite(longitude)) {
      toast.error(t("Invalid location coordinates", "无效的位置坐标"));
      return;
    }
    
    const newLocation = {
      latitude,
      longitude
    };
    
    setEffectiveLocation(newLocation);
    setLocationInitialized(true);
    
    console.log(`Location manually updated to: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  }, [t]);
  
  const handleResetLocation = useCallback(() => {
    getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setEffectiveLocation({
          latitude,
          longitude
        });
        
        console.log(`Location reset to current position: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        
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
  
  // Improved view change handler with debounce to prevent rapid switching
  const handleViewChange = useCallback((view: 'certified' | 'calculated') => {
    const now = Date.now();
    
    // Prevent rapid switching which can cause freezing
    if (view !== activeView && now - lastViewSwitchTimeRef.current > DEBOUNCE_DELAY && !viewSwitchInProgress) {
      console.log(`Switching to ${view} view mode`);
      
      // Set loading state to prevent multiple switches
      setViewSwitchInProgress(true);
      lastViewSwitchTimeRef.current = now;
      
      // Add slight delay to prevent UI freezing
      setTimeout(() => {
        setActiveView(view);
        
        // Reset the loading state with delay to ensure UI updates
        setTimeout(() => {
          setViewSwitchInProgress(false);
        }, 300);
      }, 50);
    } else if (view === activeView) {
      console.log(`Already in ${view} view, ignoring`);
    } else {
      console.log(`View switch ignored - too soon (${now - lastViewSwitchTimeRef.current}ms)`);
    }
  }, [activeView]);
  
  const toggleMapView = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);
  
  // Shorter initial load timeout for better responsiveness
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);
  
  return {
    activeView,
    showMap,
    initialLoad,
    locationLoading,
    effectiveLocation,
    locationInitialized,
    calculatedSearchRadius,
    currentSearchRadius,
    viewSwitchInProgress,
    handleRadiusChange,
    handleViewChange,
    handleLocationUpdate,
    handleResetLocation,
    toggleMapView
  };
};

export default usePhotoPointsState;
