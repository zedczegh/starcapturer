
import { useState, useEffect, useCallback } from 'react';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface Location {
  latitude: number;
  longitude: number;
}

/**
 * Hook to manage user location and location overrides
 */
export const useLocationManagement = () => {
  const { t } = useLanguage();
  const [manualLocationOverride, setManualLocationOverride] = useState<Location | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  
  // Get geolocation from browser
  const { 
    location: geoLocation, 
    loading: locationLoading,
    error: locationError,
    loadAttempts: locationLoadAttempts,
    getPosition: refreshGeolocation
  } = useGeolocation();
  
  // Set effective location (manual override or geolocation)
  const effectiveLocation = manualLocationOverride || userLocation;
  
  // Update user location when geolocation changes
  useEffect(() => {
    if (geoLocation && !manualLocationOverride) {
      setUserLocation(geoLocation);
    }
  }, [geoLocation, manualLocationOverride]);
  
  // Load saved location from localStorage on initial render
  useEffect(() => {
    try {
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        const parsed = JSON.parse(savedLocation);
        if (parsed && parsed.latitude && parsed.longitude) {
          setUserLocation(parsed);
        }
      }
    } catch (err) {
      console.error("Error loading saved location:", err);
    }
  }, []);
  
  // Handle location reset (clear override and use geolocation)
  const handleResetLocation = useCallback(() => {
    setManualLocationOverride(null);
    
    if (geoLocation) {
      setUserLocation(geoLocation);
      toast.success(t("Using your current location", "正在使用您的当前位置"));
    } else {
      refreshGeolocation();
      toast.info(t("Getting your location...", "正在获取您的位置..."));
    }
    
    try {
      localStorage.removeItem('userLocation');
    } catch (err) {
      console.error("Error removing saved location:", err);
    }
  }, [geoLocation, refreshGeolocation, t]);
  
  return {
    userLocation,
    setUserLocation,
    manualLocationOverride,
    setManualLocationOverride,
    effectiveLocation,
    locationLoading,
    locationError,
    locationLoadAttempts,
    handleResetLocation
  };
};
