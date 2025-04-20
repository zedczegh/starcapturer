
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
    
    console.log("Getting current user location for centering");
    toast.loading(t("Getting your location...", "正在获取您的位置..."), { id: "get-location" });
    
    getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // First update the location state
        onLocationUpdate(latitude, longitude);
        console.log("Got user position:", latitude, longitude);
        toast.success(t("Location found!", "已找到位置!"), { id: "get-location" });
        
        try {
          // Access the leaflet map instance from the window object
          const leafletMap = (window as any).leafletMap;
          if (leafletMap) {
            console.log("Centering map on user location:", latitude, longitude);
            
            // Set a higher zoom level for better visibility
            const zoomLevel = 13;
            
            // Use flyTo for a smoother animation
            leafletMap.flyTo([latitude, longitude], zoomLevel, {
              animate: true,
              duration: 1.2
            });
            
            console.log("Map centered successfully");
          } else {
            console.warn("Leaflet map instance not available");
            toast.error(t("Could not center map: map not initialized", "无法居中地图：地图未初始化"));
          }
        } catch (e) {
          console.error("Could not center map:", e);
          toast.error(t("Could not center map on your location", "无法将地图居中到您的位置"));
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error(t("Could not get your location", "无法获取您的位置"), { id: "get-location" });
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
