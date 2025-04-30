
import { useState, useEffect, useCallback } from 'react';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useLocalStorage } from '@/hooks/use-local-storage';

export const usePhotoPointsState = () => {
  // View mode state
  const [activeView, setActiveView] = useState<'certified' | 'calculated'>('certified');
  const [showMap, setShowMap] = useState(true);
  
  // Location and radius state
  const [effectiveLocation, setEffectiveLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [calculatedSearchRadius, setCalculatedSearchRadius] = useState(100);
  const [initialLoad, setInitialLoad] = useState(true);
  const [locationInitialized, setLocationInitialized] = useState(false);
  
  // Add forecast day state
  const [forecastDay, setForecastDay] = useState(0); // Default to today
  const [showForecast, setShowForecast] = useState(false);
  
  // Default radius settings based on view
  const certifiedRadius = 500; // 500km for certified view
  
  // Get user's current location
  const { location, loading: locationLoading, getPosition: refreshLocation } = useGeolocation();
  
  // Persist user preferences in local storage
  const [storedRadius, setStoredRadius] = useLocalStorage<number>('photo_points_radius', 100);
  const [storedView, setStoredView] = useLocalStorage<'certified' | 'calculated'>('photo_points_view', 'certified');
  const [storedShowMap, setStoredShowMap] = useLocalStorage<boolean>('photo_points_show_map', true);
  
  // Initialize from stored preferences on first load
  useEffect(() => {
    if (!locationInitialized) {
      setCalculatedSearchRadius(storedRadius);
      setActiveView(storedView);
      setShowMap(storedShowMap);
      setLocationInitialized(true);
      
      // Initialize location if available
      if (location) {
        setEffectiveLocation(location);
        setInitialLoad(false);
      }
    }
  }, [location, locationInitialized, storedRadius, storedView, storedShowMap]);
  
  // Update effective location when user location changes
  useEffect(() => {
    if (location && locationInitialized) {
      setEffectiveLocation(location);
      setInitialLoad(false);
    }
  }, [location, locationInitialized]);
  
  // Return current search radius based on active view
  const currentSearchRadius = activeView === 'certified' ? certifiedRadius : calculatedSearchRadius;

  // Handle view change between certified and calculated
  const handleViewChange = useCallback((view: 'certified' | 'calculated') => {
    setActiveView(view);
    setStoredView(view);
    // Reset forecast mode when changing views
    if (view === 'certified') {
      setShowForecast(false);
    }
  }, [setStoredView]);
  
  // Toggle forecast view
  const toggleForecastView = useCallback(() => {
    setShowForecast(prev => !prev);
  }, []);
  
  // Handle radius change for calculated view
  const handleRadiusChange = useCallback((radius: number) => {
    setCalculatedSearchRadius(radius);
    setStoredRadius(radius);
  }, [setStoredRadius]);
  
  // Handle forecast day change
  const handleForecastDayChange = useCallback((day: number) => {
    setForecastDay(day);
  }, []);
  
  // Handle location update (from map click)
  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    setEffectiveLocation({ latitude: lat, longitude: lng });
  }, []);
  
  // Reset to user's current location
  const handleResetLocation = useCallback(() => {
    refreshLocation();
    if (location) {
      setEffectiveLocation(location);
    }
  }, [refreshLocation, location]);
  
  // Toggle between map and list views
  const toggleMapView = useCallback(() => {
    setShowMap(prev => {
      setStoredShowMap(!prev);
      return !prev;
    });
  }, [setStoredShowMap]);
  
  return {
    // View state
    activeView,
    showMap,
    initialLoad,
    
    // Location state
    locationLoading,
    effectiveLocation,
    locationInitialized,
    
    // Radius state
    calculatedSearchRadius,
    currentSearchRadius,
    
    // Forecast state
    forecastDay,
    showForecast,
    
    // Actions
    handleRadiusChange,
    handleViewChange,
    handleLocationUpdate,
    handleResetLocation,
    toggleMapView,
    toggleForecastView,
    handleForecastDayChange
  };
};
