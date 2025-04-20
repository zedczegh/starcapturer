
import { useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export const useCurrentLocation = (
  setLatitude: (lat: string) => void,
  setLongitude: (lng: string) => void,
  setUserLocation: (loc: { latitude: number; longitude: number } | null) => void,
  setLocationName: (name: string) => void,
  setShowAdvancedSettings: (show: boolean) => void,
  setBortleScale: (scale: number | null) => void,
  setStatusMessage: (msg: string | null) => void,
  language: string
) => {
  const { t } = useLanguage();
  
  const handleUseCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      setStatusMessage(language === 'en' ? "Getting current location..." : "正在获取当前位置...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLatitude(latitude.toFixed(6));
          setLongitude(longitude.toFixed(6));
          setUserLocation({ latitude, longitude });
          setLocationName(language === 'en' ? "Current Location" : "当前位置");
          setStatusMessage(language === 'en' ? "Current location found" : "已找到当前位置");
          setShowAdvancedSettings(true);
          
          // Reset Bortle scale to null until we get fresh data
          setBortleScale(null);
          
          // Save this as the latest location
          try {
            localStorage.setItem('latest_siqs_location', JSON.stringify({
              name: language === 'en' ? "Current Location" : "当前位置",
              latitude,
              longitude
            }));
          } catch (error) {
            console.error("Error saving location to localStorage:", error);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setStatusMessage(
            language === 'en'
              ? "Could not get your location. Please check browser permissions."
              : "无法获取您的位置。请检查浏览器权限。"
          );
        }
      );
    } else {
      setStatusMessage(
        language === 'en'
          ? "Geolocation is not supported by your browser"
          : "您的浏览器不支持地理位置"
      );
    }
  }, [language, setStatusMessage, setUserLocation, setBortleScale, setLocationName, setLatitude, setLongitude, setShowAdvancedSettings]);
  
  return { handleUseCurrentLocation };
};
