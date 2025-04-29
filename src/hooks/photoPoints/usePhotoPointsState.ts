
import { useState, useCallback, useEffect } from 'react';
import { useGeolocation } from '../useGeolocation';

export const usePhotoPointsState = () => {
  const [activeView, setActiveView] = useState<'certified' | 'calculated'>('certified');
  const [showMap, setShowMap] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [calculatedSearchRadius, setCalculatedSearchRadius] = useState<number>(200); // Default 200km
  const [forecastDay, setForecastDay] = useState<number>(1); // Default to day 1 (tomorrow)
  const [showForecast, setShowForecast] = useState<boolean>(false); // Toggle for forecast mode
  
  const { 
    location: userLocation, 
    loading: locationLoading, 
    error: locationError, 
    getPosition 
  } = useGeolocation();
  
  const [effectiveLocation, setEffectiveLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationInitialized, setLocationInitialized] = useState(false);
  
  // Update effective location whenever user location changes
  useEffect(() => {
    if (userLocation) {
      setEffectiveLocation(userLocation);
      setLocationInitialized(true);
      
      if (initialLoad) {
        setInitialLoad(false);
      }
    }
  }, [userLocation, initialLoad]);
  
  // Toggle map view
  const toggleMapView = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);
  
  // Handle view change
  const handleViewChange = useCallback((view: 'certified' | 'calculated') => {
    setActiveView(view);
    
    // Reset forecast mode when switching views
    if (view === 'certified') {
      setShowForecast(false);
    }
  }, []);
  
  // Handle radius change
  const handleRadiusChange = useCallback((radius: number) => {
    setCalculatedSearchRadius(radius);
  }, []);
  
  // Handle forecast day change
  const handleForecastDayChange = useCallback((day: number) => {
    setForecastDay(day);
  }, []);
  
  // Toggle forecast mode
  const toggleForecastMode = useCallback(() => {
    setShowForecast(prev => !prev);
  }, []);
  
  // Handle manual location update
  const handleLocationUpdate = useCallback((latitude: number, longitude: number) => {
    setEffectiveLocation({ latitude, longitude });
  }, []);
  
  // Reset to user's actual location
  const handleResetLocation = useCallback(() => {
    getPosition();
  }, [getPosition]);
  
  // Current search radius based on view
  const currentSearchRadius = activeView === 'certified' ? 500 : calculatedSearchRadius;
  
  return {
    activeView,
    showMap,
    initialLoad,
    locationLoading,
    locationError,
    effectiveLocation,
    locationInitialized,
    calculatedSearchRadius,
    currentSearchRadius,
    forecastDay,
    showForecast,
    handleRadiusChange,
    handleForecastDayChange,
    handleViewChange,
    handleLocationUpdate,
    handleResetLocation,
    toggleMapView,
    toggleForecastMode
  };
};
