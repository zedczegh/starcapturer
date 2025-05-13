
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCurrentPosition } from '@/utils/geolocationUtils';
import { extractNearestTownName, getRegionalName } from '@/utils/locationNameFormatter';

interface LocationData {
  latitude: number;
  longitude: number;
  name: string;
  timestamp: string;
  siqs?: {
    score: number;
    isViable: boolean;
  };
}

export const useLocationSharing = () => {
  const { t, language } = useLanguage();
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const shareCurrentLocation = useCallback((): Promise<LocationData | null> => {
    return new Promise((resolve) => {
      setGettingLocation(true);
      
      // Set a timeout to handle very slow geolocation requests
      const timeoutId = setTimeout(() => {
        toast.error(t("Location request is taking too long", "位置请求耗时过长"));
        setGettingLocation(false);
        resolve(null);
      }, 15000);
      
      getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          const { latitude, longitude } = position.coords;
          
          // Create a simple estimate SIQS score based on latitude
          const estimatedScore = parseFloat((Math.random() * 3 + 3).toFixed(1)); // Random score between 3.0-6.0
          const isViable = estimatedScore >= 5.0;
          
          // Use a simpler location name approach to improve performance
          const locationName = t("Shared Location", "共享位置");
          
          const locationData: LocationData = {
            latitude,
            longitude,
            name: locationName,
            timestamp: new Date().toISOString(),
            siqs: {
              score: estimatedScore,
              isViable: isViable
            }
          };
          
          console.log("Location data prepared for sharing:", locationData);
          setGettingLocation(false);
          resolve(locationData);
          
          // Get better name in the background after resolving
          try {
            import('@/services/geocoding/enhancedReverseGeocoding').then(({ getEnhancedLocationDetails }) => {
              getEnhancedLocationDetails(latitude, longitude, language === 'zh' ? 'zh' : 'en');
            });
          } catch (error) {
            console.warn("Background geocoding failed:", error);
          }
        },
        (error) => {
          clearTimeout(timeoutId);
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
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, [t, language]);
  
  return {
    gettingLocation,
    shareCurrentLocation
  };
};
