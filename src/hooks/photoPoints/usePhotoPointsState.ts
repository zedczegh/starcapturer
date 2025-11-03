
import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { getCurrentPosition } from '@/utils/geolocationUtils';

export const usePhotoPointsState = () => {
  const { t } = useLanguage();
  const location = useLocation();
  
  const [activeView, setActiveView] = useState<'certified' | 'calculated' | 'obscura' | 'mountains'>('calculated');
  const [showMap, setShowMap] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [autoLocationRequested, setAutoLocationRequested] = useState(false);
  const [effectiveLocation, setEffectiveLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const { 
    coords: currentPosition, 
    loading: locationLoading, 
    getPosition: requestGeolocation
  } = useGeolocation();
  
  const [locationInitialized, setLocationInitialized] = useState(false);
  const [locationAttempted, setLocationAttempted] = useState(false);
  
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
    // Clear any cached permission states when user explicitly requests location
    try {
      localStorage.removeItem('geolocation_permission');
      localStorage.removeItem('geolocation_denied_at');
      console.log("Cleared cached geolocation permission states");
    } catch (e) {
      console.warn("Could not clear geolocation cache:", e);
    }
    
    // Show a loading toast
    const loadingToast = toast.loading(t("Getting your location...", "正在获取您的位置..."));
    
    getCurrentPosition(
      (position) => {
        toast.dismiss(loadingToast);
        const { latitude, longitude } = position.coords;
        setEffectiveLocation({
          latitude,
          longitude
        });
        
        console.log(`Location reset to current position: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        toast.success(t("Location updated successfully", "位置更新成功"));
        
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
        toast.dismiss(loadingToast);
        console.error("Geolocation error:", error);
        
        let errorMessage = t("Unable to get your location", "无法获取您的位置");
        if (error.code === 1) {
          errorMessage = t("Location permission denied. Please enable location access in your browser settings.", "位置权限被拒绝。请在浏览器设置中启用位置访问。");
        } else if (error.code === 2) {
          errorMessage = t("Location unavailable. Please check your device settings.", "位置不可用。请检查您的设备设置。");
        } else if (error.code === 3) {
          errorMessage = t("Location request timed out. Please try again.", "位置请求超时。请重试。");
        }
        
        toast.error(errorMessage);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0
      }
    );
  }, [t]);
  
  // Simplified view change handler with no delays
  const handleViewChange = useCallback((view: 'certified' | 'calculated' | 'obscura' | 'mountains') => {
    if (view !== activeView) {
      console.log(`Switching to ${view} view mode`);
      setActiveView(view);
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
    handleRadiusChange,
    handleViewChange,
    handleLocationUpdate,
    handleResetLocation,
    toggleMapView
  };
};

export default usePhotoPointsState;
