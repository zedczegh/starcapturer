
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCurrentPosition } from '@/utils/geolocationUtils';

interface LocationData {
  latitude: number;
  longitude: number;
  name: string;
  timestamp: string;
}

export const useLocationSharing = () => {
  const { t } = useLanguage();
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const shareCurrentLocation = useCallback((): Promise<LocationData | null> => {
    return new Promise((resolve) => {
      setGettingLocation(true);
      
      getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          const locationData: LocationData = {
            latitude,
            longitude,
            name: t("Shared Location", "共享位置"),
            timestamp: new Date().toISOString()
          };
          
          setGettingLocation(false);
          resolve(locationData);
        },
        (error) => {
          console.error("Error getting location:", error);
          let errorMessage = '';
          
          switch (error.code) {
            case 1:
              errorMessage = t(
                "Location permission denied. Please enable location access in your browser settings.", 
                "位置权限被拒绝。请在浏览器设置中启用位置访问权限。"
              );
              break;
            case 2:
              errorMessage = t(
                "Unable to determine your location. Please try again later.", 
                "无法确定您的位置。请稍后再试。"
              );
              break;
            case 3:
              errorMessage = t(
                "Location request timed out. Please try again.", 
                "位置请求超时。请重试。"
              );
              break;
            default:
              errorMessage = t(
                "An unknown error occurred while getting your location.", 
                "获取您位置时发生未知错误。"
              );
          }
          
          toast.error(errorMessage);
          setGettingLocation(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, [t]);
  
  return {
    gettingLocation,
    shareCurrentLocation
  };
};
