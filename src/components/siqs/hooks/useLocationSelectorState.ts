
import { useState, useCallback } from "react";
import { fetchLightPollutionData } from "@/lib/api";
import { estimateBortleScale } from "@/hooks/useLocationData";

interface CachedLocationData {
  name?: string;
  formattedName?: string;
  bortleScale?: number;
}

interface UseLocationSelectorStateProps {
  language: string;
  noAutoLocationRequest: boolean;
  bortleScale: number;
  setBortleScale: (scale: number) => void;
  setStatusMessage: (message: string | null) => void;
  setShowAdvancedSettings: (show: boolean) => void;
  getCachedData: (key: string, maxAge?: number) => CachedLocationData | null;
  setCachedData: (key: string, data: CachedLocationData) => void;
}

export const useLocationSelectorState = ({
  language,
  noAutoLocationRequest,
  bortleScale,
  setBortleScale,
  setStatusMessage,
  setShowAdvancedSettings,
  getCachedData,
  setCachedData
}: UseLocationSelectorStateProps) => {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  
  // Get the current location from the browser
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
  }, [language, setStatusMessage, setShowAdvancedSettings]);
  
  const handleLocationSelect = useCallback(async (location: { 
    name: string; 
    latitude: number; 
    longitude: number; 
    placeDetails?: string 
  }) => {
    setLocationName(location.name);
    setLatitude(location.latitude.toFixed(6));
    setLongitude(location.longitude.toFixed(6));
    
    const cacheKey = `loc-${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData && cachedData.bortleScale) {
      setBortleScale(cachedData.bortleScale);
      setStatusMessage(language === 'en' 
        ? `Selected location: ${location.name}` 
        : `已选择位置：${location.name}`);
      setShowAdvancedSettings(true);
      return;
    }
    
    try {
      const lightPollutionData = await fetchLightPollutionData(location.latitude, location.longitude);
      if (lightPollutionData && lightPollutionData.bortleScale) {
        setBortleScale(lightPollutionData.bortleScale);
        
        setCachedData(cacheKey, {
          name: location.name,
          bortleScale: lightPollutionData.bortleScale
        });
      }
    } catch (error) {
      console.error("Error fetching light pollution data for selected location:", error);
      const estimatedBortleScale = estimateBortleScale(location.name);
      setBortleScale(estimatedBortleScale);
    }
    
    setStatusMessage(language === 'en' 
      ? `Selected location: ${location.name}` 
      : `已选择位置：${location.name}`);
    setShowAdvancedSettings(true);
  }, [language, setBortleScale, setStatusMessage, setShowAdvancedSettings, getCachedData, setCachedData]);

  const handleRecommendedPointSelect = useCallback((point: { 
    name: string; 
    latitude: number; 
    longitude: number 
  }) => {
    setLocationName(point.name);
    setLatitude(point.latitude.toFixed(6));
    setLongitude(point.longitude.toFixed(6));
    
    setShowAdvancedSettings(true);
    setStatusMessage(language === 'en' 
      ? `Selected recommended location: ${point.name}` 
      : `已选择推荐位置：${point.name}`);
  }, [language, setStatusMessage, setShowAdvancedSettings]);
  
  return {
    userLocation,
    locationName,
    latitude,
    longitude,
    setLocationName,
    setLatitude,
    setLongitude,
    handleUseCurrentLocation,
    handleLocationSelect,
    handleRecommendedPointSelect
  };
};
