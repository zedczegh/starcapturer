
import { useState, useCallback, useEffect } from 'react';
import { useGeolocation } from '@/hooks/location/useGeolocation';

/**
 * Hook to manage photo points state
 */
export const usePhotoPointsState = () => {
  const [activeView, setActiveView] = useState<'certified' | 'calculated'>('certified');
  const [showMap, setShowMap] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [currentSearchRadius, setCurrentSearchRadius] = useState<number>(500);
  const [calculatedSearchRadius, setCalculatedSearchRadius] = useState<number>(500);
  const [selectedForecastDay, setSelectedForecastDay] = useState<number>(0); // Default to current day (0)
  const [showForecast, setShowForecast] = useState<boolean>(false);
  
  // Geolocation hook
  const {
    latitude,
    longitude,
    loading: locationLoading,
    locationInitialized,
    initializeLocation,
    updateLocation
  } = useGeolocation();
  
  // Effective location
  const effectiveLocation = latitude && longitude
    ? { latitude, longitude }
    : null;
  
  // Handle view change
  const handleViewChange = useCallback((view: 'certified' | 'calculated') => {
    setActiveView(view);
    
    // Reset forecast when switching views
    if (view === 'certified') {
      setShowForecast(false);
    }
  }, []);
  
  // Handle radius change
  const handleRadiusChange = useCallback((radius: number) => {
    setCalculatedSearchRadius(radius);
    setCurrentSearchRadius(radius);
  }, []);
  
  // Handle forecast day change
  const handleForecastDayChange = useCallback((day: number) => {
    setSelectedForecastDay(day);
  }, []);
  
  // Toggle forecast view
  const toggleForecastView = useCallback(() => {
    setShowForecast(prev => !prev);
  }, []);
  
  // Toggle map view
  const toggleMapView = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);
  
  // Handle location update
  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    updateLocation(lat, lng);
  }, [updateLocation]);
  
  // Handle reset location
  const handleResetLocation = useCallback(() => {
    initializeLocation();
  }, [initializeLocation]);
  
  // Initialize location on mount
  useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);
  
  // Set initial load to false once location is initialized
  useEffect(() => {
    if (locationInitialized) {
      const timer = setTimeout(() => {
        setInitialLoad(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [locationInitialized]);
  
  return {
    activeView,
    showMap,
    initialLoad,
    locationLoading,
    effectiveLocation,
    locationInitialized,
    calculatedSearchRadius,
    currentSearchRadius,
    selectedForecastDay,
    showForecast,
    handleRadiusChange,
    handleViewChange,
    handleLocationUpdate,
    handleResetLocation,
    toggleMapView,
    handleForecastDayChange,
    toggleForecastView
  };
};
