
import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGeolocation } from '@/hooks/location/useGeolocation';

export const usePhotoPointsState = () => {
  const { t } = useLanguage();
  const location = useLocation();
  
  // For view toggling
  const [activeView, setActiveView] = useState<'certified' | 'calculated'>('certified');
  
  // For layout toggling
  const [showMap, setShowMap] = useState(false);
  
  // For initializing states
  const [initialLoad, setInitialLoad] = useState(true);
  
  // For location tracking
  const [effectiveLocation, setEffectiveLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const { coords: currentPosition, loading: locationLoading, getPosition } = useGeolocation();
  
  // Update effective location when current position changes
  useEffect(() => {
    if (currentPosition) {
      setEffectiveLocation({
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude
      });
    }
  }, [currentPosition]);

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
  
  // Reset location to user's current position
  const handleResetLocation = useCallback(() => {
    getPosition();
  }, [getPosition]);
  
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
