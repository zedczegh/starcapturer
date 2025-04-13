
import { useState, useEffect, useCallback, useRef } from 'react';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { clearLocationCache } from '@/services/realTimeSiqsService/locationUpdateService';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

const DEFAULT_CALCULATED_RADIUS = 100; // 100km default radius for calculated locations
const DEFAULT_CERTIFIED_RADIUS = 100000; // 100000km for certified locations (effectively global)

export const usePhotoPointsNearby = () => {
  const { 
    loading: locationLoading, 
    coords, 
    getPosition, 
    error: locationError 
  } = useGeolocation({
    enableHighAccuracy: true,
    maximumAge: 60000, // Use cached position for 1 minute to avoid repeated calls
    timeout: 10000 // Timeout after 10 seconds
  });
  
  const [activeView, setActiveView] = useState<'certified' | 'calculated'>('certified');
  const [initialLoad, setInitialLoad] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [locationLoadAttempts, setLocationLoadAttempts] = useState(0);
  const [manualLocationOverride, setManualLocationOverride] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [calculatedSearchRadius, setCalculatedSearchRadius] = useState<number>(DEFAULT_CALCULATED_RADIUS);

  useEffect(() => {
    if (!coords && locationLoadAttempts < 3) {
      console.log("Getting user position, attempt:", locationLoadAttempts + 1);
      const timeoutId = setTimeout(() => {
        getPosition();
        setLocationLoadAttempts(prev => prev + 1);
      }, locationLoadAttempts * 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [getPosition, coords, locationLoadAttempts]);
  
  useEffect(() => {
    if (coords && !manualLocationOverride) {
      const newLocation = { latitude: coords.latitude, longitude: coords.longitude };
      setUserLocation(newLocation);
      
      try {
        localStorage.setItem('userLocation', JSON.stringify(newLocation));
        console.log("Updated user location from geolocation:", newLocation);
      } catch (err) {
        console.error("Error saving location to localStorage:", err);
      }
    }
  }, [coords, manualLocationOverride]);
  
  useEffect(() => {
    if ((locationError || locationLoadAttempts >= 3) && !userLocation && !manualLocationOverride) {
      try {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
          const parsedLocation = JSON.parse(savedLocation);
          if (parsedLocation && typeof parsedLocation.latitude === 'number' && typeof parsedLocation.longitude === 'number') {
            setUserLocation(parsedLocation);
            console.log("Using saved location from localStorage as fallback:", parsedLocation);
          }
        }
      } catch (err) {
        console.error("Error loading saved location:", err);
      }
    }
  }, [locationError, userLocation, locationLoadAttempts, manualLocationOverride]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const effectiveLocation = manualLocationOverride || userLocation;

  const handleViewChange = useCallback((view: 'certified' | 'calculated') => {
    setActiveView(view);
    
    clearLocationCache();
  }, []);
  
  const handleLocationUpdate = useCallback((latitude: number, longitude: number) => {
    const newLocation = { latitude, longitude };
    
    setManualLocationOverride(newLocation);
    setUserLocation(newLocation);
    
    try {
      localStorage.setItem('userLocation', JSON.stringify(newLocation));
      console.log("Updated user location from map click:", newLocation);
    } catch (err) {
      console.error("Error saving location to localStorage:", err);
    }
    
    try {
      clearLocationCache();
      console.log("Cleared location cache after location change");
    } catch (err) {
      console.error("Error clearing location cache:", err);
    }
  }, []);

  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    if (location && location.latitude && location.longitude) {
      const locationId = location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
      navigate(`/location/${locationId}`, { 
        state: {
          id: locationId,
          name: location.name,
          chineseName: location.chineseName,
          latitude: location.latitude,
          longitude: location.longitude,
          bortleScale: location.bortleScale || 4,
          siqs: location.siqs,
          siqsResult: location.siqs ? { score: location.siqs } : undefined,
          certification: location.certification,
          isDarkSkyReserve: location.isDarkSkyReserve,
          timestamp: new Date().toISOString(),
          fromPhotoPoints: true
        } 
      });
      console.log("Opening location details", locationId);
    }
  }, [navigate]);

  const toggleMapView = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);

  const handleResetLocation = useCallback(() => {
    setManualLocationOverride(null);
    if (coords) {
      const newLocation = { latitude: coords.latitude, longitude: coords.longitude };
      setUserLocation(newLocation);
      localStorage.setItem('userLocation', JSON.stringify(newLocation));
    } else {
      getPosition();
    }
  }, [coords, getPosition]);

  const handleRadiusChange = useCallback((value: number) => {
    if (activeView === 'calculated') {
      setCalculatedSearchRadius(value);
    }
  }, [activeView]);

  return {
    // Location state
    userLocation: effectiveLocation,
    locationLoading,
    
    // View state
    activeView,
    showMap,
    initialLoad,
    
    // Radius state
    calculatedSearchRadius,
    DEFAULT_CALCULATED_RADIUS,
    DEFAULT_CERTIFIED_RADIUS,
    
    // Handlers
    handleViewChange,
    handleLocationUpdate,
    handleLocationClick,
    toggleMapView,
    handleResetLocation,
    handleRadiusChange,
    
    // Utils
    t
  };
};

export default usePhotoPointsNearby;
