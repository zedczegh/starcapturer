
import { useState, useCallback, useEffect } from 'react';
import useGeolocation from '@/hooks/use-geolocation';
import useLocalStorage from '@/hooks/use-local-storage';

export const usePhotoPointsState = () => {
  // Search view state (certified or calculated)
  const [activeView, setActiveView] = useState<'certified' | 'calculated'>('certified');
  // Map view toggle
  const [showMap, setShowMap] = useState(true);
  // Flag for initial load state
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Toggle for forecast view
  const [showForecast, setShowForecast] = useState(false);
  // Selected forecast day (0 = today, 1 = tomorrow, etc.)
  const [forecastDay, setForecastDay] = useState(0);
  
  // User location from browser geolocation
  const { 
    latitude, 
    longitude, 
    error: locationError, 
    loading: locationLoading
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5 * 60 * 1000 // 5 minutes
  });
  
  // Store default search radius - based on view
  const [certifiedSearchRadius, setCertifiedSearchRadius] = useLocalStorage<number>('certifiedSearchRadius', 5000);
  const [calculatedSearchRadius, setCalculatedSearchRadius] = useLocalStorage<number>('calculatedSearchRadius', 500);
  
  // Store manual location
  const [manualLocation, setManualLocation] = useLocalStorage<{ latitude: number; longitude: number } | null>(
    'manualLocation', 
    null
  );
  
  // Flag for whether we're using manual location
  const [useManualLocation, setUseManualLocation] = useLocalStorage<boolean>('useManualLocation', false);
  
  // Effective location (either user location or manual location)
  const effectiveLocation = useManualLocation && manualLocation
    ? manualLocation
    : (latitude && longitude) ? { latitude, longitude } : null;
  
  // Initialize location state
  const [locationInitialized, setLocationInitialized] = useState(false);
  
  // Get current search radius based on active view
  const currentSearchRadius = activeView === 'certified' 
    ? certifiedSearchRadius 
    : calculatedSearchRadius;
  
  // Handle view change between certified and calculated spots
  const handleViewChange = useCallback((view: 'certified' | 'calculated') => {
    setActiveView(view);
  }, []);
  
  // Handle radius change
  const handleRadiusChange = useCallback((radius: number) => {
    if (activeView === 'certified') {
      setCertifiedSearchRadius(radius);
    } else {
      setCalculatedSearchRadius(radius);
    }
  }, [activeView, setCertifiedSearchRadius, setCalculatedSearchRadius]);
  
  // Handle location update (from map click)
  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    setManualLocation({ latitude: lat, longitude: lng });
    setUseManualLocation(true);
  }, [setManualLocation, setUseManualLocation]);
  
  // Reset to browser geolocation
  const handleResetLocation = useCallback(() => {
    setUseManualLocation(false);
  }, [setUseManualLocation]);
  
  // Toggle map view
  const toggleMapView = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);
  
  // Toggle forecast view
  const toggleForecastView = useCallback(() => {
    setShowForecast(prev => !prev);
  }, []);
  
  // Handle forecast day change
  const handleForecastDayChange = useCallback((day: number) => {
    setForecastDay(day);
  }, []);
  
  // Set location initialized after we have a location or error
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      setLocationInitialized(true);
      setInitialLoad(false);
    } else if (locationError) {
      setLocationInitialized(true);
      setInitialLoad(false);
    }
  }, [latitude, longitude, locationError]);
  
  return {
    activeView,
    showMap,
    initialLoad,
    locationLoading,
    effectiveLocation,
    locationInitialized,
    calculatedSearchRadius,
    currentSearchRadius,
    forecastDay,
    showForecast,
    handleRadiusChange,
    handleViewChange,
    handleLocationUpdate,
    handleResetLocation,
    toggleMapView,
    toggleForecastView,
    handleForecastDayChange
  };
};
