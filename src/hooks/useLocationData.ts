
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocationDataCache } from "./location/useLocationCache";
import { useGeolocation } from "./location/useGeolocation";
import { getBortleScaleForLocation } from "./location/useBortleScale";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocationFromCoordinates, validateCoordinates } from "@/services/locationService";

export { useLocationDataCache } from "./location/useLocationCache";
export { estimateBortleScale } from "./location/useBortleScale";

export const useCurrentLocation = (language: string, noAutoLocationRequest: boolean = false) => {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [formattedLocationName, setFormattedLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [bortleScale, setBortleScale] = useState(4);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { setCachedData, getCachedData } = useLocationDataCache();
  const { toast } = useToast();
  const { t } = useLanguage();

  const geo = useGeolocation({ 
    enableHighAccuracy: true, 
    timeout: 12000, 
    maximumAge: 0,
    language 
  });

  useEffect(() => {
    if (geo.error) {
      setStatusMessage(geo.error);
    }
  }, [geo.error]);

  useEffect(() => {
    if (geo.coords) {
      const lat = geo.coords.latitude;
      const lng = geo.coords.longitude;
      
      handleLocationFound(lat, lng);
    }
  }, [geo.coords]);

  const handleLocationFound = async (lat: number, lng: number) => {
    try {
      // Validate coordinates
      const { latitude: validLat, longitude: validLng } = validateCoordinates({ latitude: lat, longitude: lng });
      
      setLatitude(validLat.toFixed(6));
      setLongitude(validLng.toFixed(6));
      setUserLocation({ latitude: validLat, longitude: validLng });
      
      // Check for cached data
      const cacheKey = `loc-${validLat.toFixed(4)}-${validLng.toFixed(4)}`;
      const cachedData = getCachedData(cacheKey);
      
      if (cachedData) {
        setLocationName(cachedData.name);
        setFormattedLocationName(cachedData.formattedName || cachedData.name);
        setBortleScale(cachedData.bortleScale);
        setStatusMessage(language === 'en' ? "Location found: " : "位置已找到：" + (cachedData.formattedName || cachedData.name));
        return;
      }
      
      // Use our local location database
      const locationInfo = getLocationFromCoordinates(validLat, validLng);
      
      setLocationName(locationInfo.name);
      setFormattedLocationName(locationInfo.formattedName);
      setBortleScale(locationInfo.bortleScale);
      
      // Cache this data for future use
      setCachedData(cacheKey, {
        name: locationInfo.name,
        formattedName: locationInfo.formattedName,
        bortleScale: locationInfo.bortleScale
      });
      
      setStatusMessage(
        language === 'en' 
          ? `Location found: ${locationInfo.formattedName}` 
          : `位置已找到：${locationInfo.formattedName}`
      );
    } catch (error) {
      console.error("Error getting location:", error);
      setStatusMessage(
        language === 'en'
          ? "Could not determine exact location. Using approximate coordinates."
          : "无法确定确切位置。使用近似坐标。"
      );
    }
  };

  const handleUseCurrentLocation = () => {
    if (geo.loading) return;
    
    setStatusMessage(language === 'en' ? "Waiting for permission and location data..." : "等待位置权限和数据...");
    geo.getPosition();
  };

  return {
    loading: geo.loading,
    userLocation,
    locationName,
    formattedLocationName,
    latitude,
    longitude,
    bortleScale,
    statusMessage,
    setLocationName,
    setLatitude,
    setLongitude,
    setBortleScale,
    setStatusMessage,
    handleUseCurrentLocation,
    handleLocationFound
  };
};
