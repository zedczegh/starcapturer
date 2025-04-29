
import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useGeolocation } from '@/hooks/use-geolocation';

export const usePhotoPointsState = () => {
  // State for view mode (certified vs. calculated)
  const [activeView, setActiveView] = useLocalStorage<'certified' | 'calculated'>(
    'photo-points-active-view',
    'calculated'
  );
  
  // State for forecast mode
  const [showForecast, setShowForecast] = useLocalStorage<boolean>(
    'photo-points-forecast-mode',
    false
  );
  
  // State for forecast day (0 = today, 1 = tomorrow, etc.)
  const [selectedForecastDay, setSelectedForecastDay] = useLocalStorage<number>(
    'photo-points-forecast-day',
    0
  );
  
  // State for map view toggle
  const [showMap, setShowMap] = useLocalStorage<boolean>(
    'photo-points-show-map',
    true
  );

  // Use geolocation hook to get user's location
  const { 
    coords, 
    error, 
    loading, 
    getPosition,
    locationInitialized = false,
    updateLocation
  } = useGeolocation();

  // Extract latitude and longitude from coords for easier use
  const latitude = coords?.latitude;
  const longitude = coords?.longitude;

  // State for search radius
  const [calculatedSearchRadius, setCalculatedSearchRadius] = useLocalStorage<number>(
    'calculated-search-radius',
    200
  );
  
  const [certifiedSearchRadius, setCertifiedSearchRadius] = useLocalStorage<number>(
    'certified-search-radius',
    500
  );
  
  // Manual location override (when user clicks on map)
  const [manualLocation, setManualLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  // Initialize location handling
  const [initialLoad, setInitialLoad] = useState(true);
  
  useEffect(() => {
    if (locationInitialized || error || latitude) {
      setInitialLoad(false);
    }
  }, [locationInitialized, error, latitude]);
  
  // Function to handle radius change
  const handleRadiusChange = useCallback((value: number) => {
    if (activeView === 'certified') {
      setCertifiedSearchRadius(value);
    } else {
      setCalculatedSearchRadius(value);
    }
  }, [activeView, setCertifiedSearchRadius, setCalculatedSearchRadius]);
  
  // Function to handle view mode change
  const handleViewChange = useCallback((view: 'certified' | 'calculated') => {
    setActiveView(view);
    
    // When switching to certified, disable forecast mode
    if (view === 'certified' && showForecast) {
      setShowForecast(false);
    }
  }, [setActiveView, showForecast, setShowForecast]);
  
  // Function to toggle map view
  const toggleMapView = useCallback(() => {
    setShowMap(prev => !prev);
  }, [setShowMap]);
  
  // Function to toggle forecast mode
  const toggleForecastView = useCallback(() => {
    setShowForecast(prev => !prev);
  }, [setShowForecast]);
  
  // Function to handle forecast day change
  const handleForecastDayChange = useCallback((day: number) => {
    setSelectedForecastDay(day);
  }, [setSelectedForecastDay]);
  
  // Function to handle location update (map click)
  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    if (updateLocation) {
      updateLocation(lat, lng);
    } else {
      // Fallback if updateLocation is not available
      setManualLocation({ latitude: lat, longitude: lng });
    }
  }, [updateLocation]);
  
  // Function to reset to device location
  const handleResetLocation = useCallback(() => {
    if (getPosition) {
      getPosition();
      setManualLocation(null);
    }
  }, [getPosition]);
  
  // Determine effective location (device or manual override)
  const effectiveLocation = manualLocation || (coords ? { latitude, longitude } : null);
  
  // Determine current search radius based on active view
  const currentSearchRadius = activeView === 'certified' 
    ? certifiedSearchRadius 
    : calculatedSearchRadius;
  
  return {
    activeView,
    showMap,
    initialLoad,
    locationLoading: loading,
    effectiveLocation,
    locationInitialized: Boolean(locationInitialized || latitude || manualLocation),
    calculatedSearchRadius,
    certifiedSearchRadius,
    currentSearchRadius,
    showForecast,
    selectedForecastDay,
    handleRadiusChange,
    handleViewChange,
    handleLocationUpdate,
    handleResetLocation,
    toggleMapView,
    toggleForecastView,
    handleForecastDayChange
  };
};
