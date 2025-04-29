
import { useState, useEffect, useCallback } from 'react';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useLocalStorage } from '@/hooks/use-local-storage';

export const usePhotoPointsState = () => {
  const [activeView, setActiveView] = useState<'certified' | 'calculated'>('calculated');
  const [showMap, setShowMap] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [calculatedSearchRadius, setCalculatedSearchRadius] = useState(500);
  const [certifiedSearchRadius, setCertifiedSearchRadius] = useState(10000);
  const [selectedForecastDay, setSelectedForecastDay] = useState(0);
  const [showForecast, setShowForecast] = useState(false);

  // Get user location state
  const { 
    coords, 
    error: locationError, 
    loading: locationLoading, 
    getPosition 
  } = useGeolocation();
  
  // Store the effective location (either from geolocation or manually set)
  const [effectiveLocation, setEffectiveLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [manualLocation, setManualLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationInitialized, setLocationInitialized] = useState(false);

  // Store location preferences in local storage
  const [storedViewMode, setStoredViewMode] = useLocalStorage<string>('astromapViewMode', 'calculated');
  const [storedShowMap, setStoredShowMap] = useLocalStorage<boolean>('astromapShowMap', true);
  const [storedSearchRadius, setStoredSearchRadius] = useLocalStorage<number>('astromapSearchRadius', 500);

  // Initialize state from local storage
  useEffect(() => {
    if (storedViewMode) {
      setActiveView(storedViewMode as 'certified' | 'calculated');
    }
    if (typeof storedShowMap === 'boolean') {
      setShowMap(storedShowMap);
    }
    if (storedSearchRadius) {
      setCalculatedSearchRadius(storedSearchRadius);
    }
  }, [storedViewMode, storedShowMap, storedSearchRadius]);

  // Update effective location when coordinates change
  useEffect(() => {
    if (coords) {
      if (!manualLocation) {
        setEffectiveLocation({ 
          latitude: coords.latitude, 
          longitude: coords.longitude 
        });
      }
      setLocationInitialized(true);
    }
  }, [coords, manualLocation]);

  // Handle view changing
  const handleViewChange = useCallback((view: 'certified' | 'calculated') => {
    setActiveView(view);
    setStoredViewMode(view);
  }, [setStoredViewMode]);

  // Handle location updating
  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    setManualLocation({ latitude: lat, longitude: lng });
    setEffectiveLocation({ latitude: lat, longitude: lng });
    setLocationInitialized(true);
  }, []);

  // Handle search radius changing
  const handleRadiusChange = useCallback((value: number) => {
    setCalculatedSearchRadius(value);
    setStoredSearchRadius(value);
  }, [setStoredSearchRadius]);

  // Handle location resetting
  const handleResetLocation = useCallback(() => {
    setManualLocation(null);
    getPosition();
    
    // If we have coords, use them immediately
    if (coords) {
      setEffectiveLocation({
        latitude: coords.latitude,
        longitude: coords.longitude
      });
    }
  }, [getPosition, coords]);

  // Toggle map view
  const toggleMapView = useCallback(() => {
    setShowMap(prev => {
      const newValue = !prev;
      setStoredShowMap(newValue);
      return newValue;
    });
  }, [setStoredShowMap]);

  // Handle forecast day change
  const handleForecastDayChange = useCallback((day: number) => {
    setSelectedForecastDay(day);
  }, []);

  // Toggle forecast view
  const toggleForecastView = useCallback(() => {
    setShowForecast(prev => !prev);
    // Reset to day 0 when toggling forecast
    setSelectedForecastDay(0);
  }, []);

  // Get the current search radius based on active view
  const currentSearchRadius = activeView === 'certified' 
    ? certifiedSearchRadius 
    : calculatedSearchRadius;

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
