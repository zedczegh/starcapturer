
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
      
      getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Create a simple estimate SIQS score based on latitude
          // In a real app, this would come from an API or calculation
          const estimatedScore = parseFloat((Math.random() * 3 + 3).toFixed(1)); // Random score between 3.0-6.0
          const isViable = estimatedScore >= 5.0;
          
          // Try to get a better location name via reverse geocoding
          let locationName = t("Shared Location", "共享位置");
          
          try {
            // Import the service directly to avoid circular dependencies
            const { getEnhancedLocationDetails } = await import('@/services/geocoding/enhancedReverseGeocoding');
            const locationDetails = await getEnhancedLocationDetails(latitude, longitude, language === 'zh' ? 'zh' : 'en');
            
            if (locationDetails && locationDetails.formattedName && !locationDetails.formattedName.includes("°")) {
              locationName = locationDetails.formattedName;
            }
          } catch (error) {
            console.warn("Could not get detailed location name, using fallback:", error);
            // Use regional name as fallback
            locationName = getRegionalName(latitude, longitude, language === 'zh' ? 'zh' : 'en');
          }
          
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
  }, [t, language]);
  
  return {
    gettingLocation,
    shareCurrentLocation
  };
};
