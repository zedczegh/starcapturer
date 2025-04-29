
import { useState, useCallback, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocationState } from '@/hooks/useLocationState';

export const usePhotoPointsState = () => {
  const { userLocation, locationInitialized, locationLoading, handleLocationUpdate, handleResetLocation } = useLocationState();
  const [activeView, setActiveView] = useState<'certified' | 'calculated'>('certified');
  const [showMap, setShowMap] = useState(true);
  const [calculatedSearchRadius, setCalculatedSearchRadius] = useState(100);
  const [forecastDay, setForecastDay] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [currentSearchRadius, setCurrentSearchRadius] = useState(0);
  const isMobile = useIsMobile();

  // Use ref to track if this is the first load
  const isFirstLoad = useRef(true);
  
  // Set initial search radius based on device type
  useEffect(() => {
    if (isFirstLoad.current) {
      const initialRadius = isMobile ? 200 : 300;
      setCalculatedSearchRadius(initialRadius);
      isFirstLoad.current = false;
    }
  }, [isMobile]);
  
  // Update current search radius when calculated radius changes
  useEffect(() => {
    if (activeView === 'calculated') {
      setCurrentSearchRadius(calculatedSearchRadius);
    }
  }, [calculatedSearchRadius, activeView]);

  // Handle view change
  const handleViewChange = useCallback((view: 'certified' | 'calculated') => {
    setActiveView(view);
    
    // Set appropriate search radius for the view
    if (view === 'certified') {
      // For certified view, use a large radius to get all locations
      setCurrentSearchRadius(10000);
    } else {
      // For calculated view, use the user-set radius
      setCurrentSearchRadius(calculatedSearchRadius);
    }
    
    // Reset forecast day when changing views
    if (view === 'certified') {
      setForecastDay(0);
    }
    
    // Reset initialLoad to trigger a refresh
    setInitialLoad(false);
    
    setTimeout(() => {
      setInitialLoad(true);
    }, 100);
  }, [calculatedSearchRadius]);

  // Update location with delay to avoid too many API calls
  const handleDelayedLocationUpdate = useCallback((latitude: number, longitude: number) => {
    setIsUpdatingLocation(true);
    
    // Set a small delay to avoid flickering and too many API calls
    setTimeout(() => {
      handleLocationUpdate(latitude, longitude);
      setIsUpdatingLocation(false);
    }, 300);
  }, [handleLocationUpdate]);

  // Handle radius change
  const handleRadiusChange = useCallback((value: number) => {
    setCalculatedSearchRadius(value);
  }, []);
  
  // Handle forecast day change
  const handleForecastDayChange = useCallback((value: number) => {
    setForecastDay(value);
  }, []);

  // Toggle map view
  const toggleMapView = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);
  
  // Determine effective location
  const effectiveLocation = userLocation ? {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude
  } : null;

  return {
    activeView,
    showMap,
    initialLoad,
    locationLoading,
    isUpdatingLocation,
    effectiveLocation,
    locationInitialized,
    calculatedSearchRadius,
    currentSearchRadius,
    forecastDay,
    handleRadiusChange,
    handleForecastDayChange,
    handleViewChange,
    handleLocationUpdate: handleDelayedLocationUpdate,
    handleResetLocation,
    toggleMapView
  };
};

export default usePhotoPointsState;
