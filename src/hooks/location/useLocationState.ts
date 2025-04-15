
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGeolocation } from './useGeolocation';

export const useLocationState = () => {
  const { t } = useLanguage();
  
  // State for user location
  const [effectiveLocation, setEffectiveLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Use geolocation hook for getting user position
  const { 
    coords: currentPosition, 
    loading: locationLoading, 
    getPosition
  } = useGeolocation();
  
  // When geolocation updates, sync with effective location
  useEffect(() => {
    if (currentPosition) {
      setEffectiveLocation({
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude
      });
    }
  }, [currentPosition]);
  
  // Handle location update from map or other sources
  const handleLocationUpdate = useCallback((latitude: number, longitude: number) => {
    if (!isFinite(latitude) || !isFinite(longitude)) {
      toast.error(t("Invalid location coordinates", "无效的位置坐标"));
      return;
    }
    
    setEffectiveLocation({
      latitude,
      longitude
    });
    
    console.log(`Location updated to: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  }, [t]);
  
  // Reset location to user's current position
  const handleResetLocation = useCallback(() => {
    getPosition();
    
    if (currentPosition) {
      setEffectiveLocation({
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude
      });
      console.log(`Location reset to current position: ${currentPosition.latitude.toFixed(4)}, ${currentPosition.longitude.toFixed(4)}`);
    } else {
      toast.error(t("Unable to get your location", "无法获取您的位置"));
    }
  }, [currentPosition, getPosition, t]);
  
  return {
    locationLoading,
    effectiveLocation,
    handleLocationUpdate,
    handleResetLocation
  };
};
