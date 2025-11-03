
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function useLocationManagement(
  onLocationUpdate?: (latitude: number, longitude: number) => void
) {
  const { t } = useLanguage();

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (onLocationUpdate) {
      console.log("Setting new location from map click:", lat, lng);
      onLocationUpdate(lat, lng);
    }
  }, [onLocationUpdate]);

  const handleGetLocation = useCallback(() => {
    if (!onLocationUpdate) return;
    
    const loadingToast = toast.loading(t("Getting your location...", "正在获取您的位置..."));
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        toast.dismiss(loadingToast);
        const { latitude, longitude } = position.coords;
        onLocationUpdate(latitude, longitude);
        console.log("Got user position:", latitude, longitude);
        toast.success(t("Location updated successfully", "位置更新成功"));
        
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
        toast.dismiss(loadingToast);
        console.error("Geolocation error:", error);
        
        let errorMessage = t("Could not get your location", "无法获取您的位置");
        if (error.code === 1) {
          errorMessage = t("Location permission denied", "位置权限被拒绝");
        } else if (error.code === 2) {
          errorMessage = t("Location unavailable", "位置不可用");
        } else if (error.code === 3) {
          errorMessage = t("Location request timed out", "位置请求超时");
        }
        
        toast.error(errorMessage);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0
      }
    );
  }, [onLocationUpdate, t]);

  return {
    handleMapClick,
    handleGetLocation
  };
}
