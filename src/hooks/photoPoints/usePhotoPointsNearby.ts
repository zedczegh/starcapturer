
import { useState, useEffect, useCallback } from 'react';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { calculateDistance } from '@/utils/geoUtils';
import { useRecommendedLocations } from './useRecommendedLocations';
import { clearLocationCache } from '@/services/realTimeSiqsService/locationUpdateService';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

const DEFAULT_CERTIFIED_RADIUS = 10000; // 10000km for certified locations (no limit)
const DEFAULT_CALCULATED_RADIUS = 100;  // 100km default radius for calculated locations

interface UsePhotoPointsNearbyProps {
  initialRadius?: number;
}

export const usePhotoPointsNearby = ({ initialRadius = DEFAULT_CALCULATED_RADIUS }: UsePhotoPointsNearbyProps = {}) => {
  const { loading: locationLoading, coords, getPosition, error: locationError } = useGeolocation({
    enableHighAccuracy: true
  });
  
  const [activeView, setActiveView] = useState<'certified' | 'calculated'>('certified');
  const [initialLoad, setInitialLoad] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const { t } = useLanguage();
  const [locationLoadAttempts, setLocationLoadAttempts] = useState(0);
  const [manualLocationOverride, setManualLocationOverride] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [calculatedSearchRadius, setCalculatedSearchRadius] = useState<number>(initialRadius);

  // Handle initial geolocation
  useEffect(() => {
    getPosition();
    const retryTimeout = setTimeout(() => {
      if (!coords && locationLoadAttempts < 3) {
        console.log("Retrying to get user position...");
        getPosition();
        setLocationLoadAttempts(prev => prev + 1);
      }
    }, 2000);
    
    return () => clearTimeout(retryTimeout);
  }, [getPosition, coords, locationLoadAttempts]);
  
  // Update user location when coordinates are available
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
  
  // Fallback to saved location
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

  const effectiveLocation = manualLocationOverride || userLocation;
  
  // Use the recommended locations hook
  const {
    searchRadius,
    setSearchRadius,
    locations,
    loading,
    searching,
    hasMore,
    loadMore,
    refreshSiqsData,
    canLoadMoreCalculated,
    loadMoreCalculatedLocations,
    loadMoreClickCount,
    maxLoadMoreClicks
  } = useRecommendedLocations(
    effectiveLocation, 
    activeView === 'certified' ? DEFAULT_CERTIFIED_RADIUS : calculatedSearchRadius
  );

  const handleRadiusChange = useCallback((value: number) => {
    if (activeView === 'calculated') {
      setCalculatedSearchRadius(value);
      setSearchRadius(value);
    }
  }, [setSearchRadius, activeView]);
  
  const handleViewChange = useCallback((view: 'certified' | 'calculated') => {
    setActiveView(view);
    
    if (view === 'certified') {
      setSearchRadius(DEFAULT_CERTIFIED_RADIUS);
    } else {
      setSearchRadius(calculatedSearchRadius);
    }
    
    clearLocationCache();
  }, [setSearchRadius, calculatedSearchRadius]);
  
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
    
    refreshSiqsData();
  }, [refreshSiqsData]);

  const handleResetLocation = useCallback(() => {
    setManualLocationOverride(null);
    if (coords) {
      const newLocation = { latitude: coords.latitude, longitude: coords.longitude };
      setUserLocation(newLocation);
      localStorage.setItem('userLocation', JSON.stringify(newLocation));
      toast.success(t("Reset to current location", "重置为当前位置"));
    } else {
      getPosition();
      toast.info(t("Getting your location...", "获取您的位置中..."));
    }
  }, [coords, getPosition, t]);

  // Process and filter locations by current view
  const processFilteredLocations = useCallback((allLocations: SharedAstroSpot[]) => {
    // Filter calculated locations by distance if needed
    if (activeView === 'calculated' && effectiveLocation) {
      return allLocations.filter(loc => {
        // Skip if no coordinates
        if (!loc.latitude || !loc.longitude) return false;
        
        // Always include certified locations
        if (loc.isDarkSkyReserve || loc.certification) return true;
        
        // For calculated spots, check distance
        const distance = loc.distance || calculateDistance(
          effectiveLocation.latitude,
          effectiveLocation.longitude,
          loc.latitude,
          loc.longitude
        );
        
        return distance <= calculatedSearchRadius;
      });
    }
    
    return allLocations;
  }, [activeView, calculatedSearchRadius, effectiveLocation]);

  // Complete initial load after timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Toggle map view
  const toggleMapView = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);

  return {
    activeView,
    handleViewChange,
    showMap,
    toggleMapView,
    userLocation: effectiveLocation,
    locationLoading,
    handleResetLocation,
    initialLoad,
    locations,
    loading,
    searching,
    hasMore,
    loadMore,
    refreshSiqsData,
    calculatedSearchRadius,
    handleRadiusChange,
    handleLocationUpdate,
    canLoadMoreCalculated,
    loadMoreCalculatedLocations,
    loadMoreClickCount,
    maxLoadMoreClicks,
    processFilteredLocations,
    displayRadius: activeView === 'certified' ? DEFAULT_CERTIFIED_RADIUS : calculatedSearchRadius,
  };
};
