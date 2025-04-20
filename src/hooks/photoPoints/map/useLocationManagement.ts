
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCurrentPosition } from '@/utils/geolocationUtils';

export function useLocationManagement(
  onLocationUpdate?: (latitude: number, longitude: number) => void
) {
  const { t, language } = useLanguage();

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (onLocationUpdate) {
      console.log("Setting new location from map click:", lat, lng);
      onLocationUpdate(lat, lng);
    }
  }, [onLocationUpdate]);

  const handleGetLocation = useCallback(() => {
    if (!onLocationUpdate) return;
    
    getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationUpdate(latitude, longitude);
        console.log("Got user position:", latitude, longitude);
        
        try {
          const leafletMap = (window as any).leafletMap;
          if (leafletMap) {
            leafletMap.setView([latitude, longitude], 12, { 
              animate: true,
              duration: 1.5 
            });
          }
        } catch (e) {
          console.error("Could not center map:", e);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error(t("Could not get your location", "无法获取您的位置"));
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0,
        language
      }
    );
  }, [onLocationUpdate, t, language]);

  return {
    handleMapClick,
    handleGetLocation
  };
}
