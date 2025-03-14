
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import useLocationCache from "./location/useLocationCache";
import { useGeolocation } from "./location/useGeolocation";
import { getBortleScaleForLocation } from "./location/useBortleScale";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocationFromCoordinates, validateCoordinates } from "@/services/locationService";
import { Language } from "@/services/geocoding/types";

// Re-export the location cache hook with a more descriptive name
export const useLocationDataCache = useLocationCache;
export { estimateBortleScale } from "./location/useBortleScale";

export const useCurrentLocation = (language: Language, noAutoLocationRequest: boolean = false) => {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [formattedLocationName, setFormattedLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [bortleScale, setBortleScale] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { setCachedData, getCachedData } = useLocationDataCache();
  const { toast } = useToast();
  const { t } = useLanguage();

  const geo = useGeolocation({ 
    enableHighAccuracy: true, 
    timeout: 15000,
    maximumAge: 30000, // Reduced from 60000 to get more recent data
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

  const handleLocationFound = useCallback(async (lat: number, lng: number) => {
    try {
      // Validate coordinates
      const { latitude: validLat, longitude: validLng } = validateCoordinates({ latitude: lat, longitude: lng });
      
      setLatitude(validLat.toFixed(6));
      setLongitude(validLng.toFixed(6));
      setUserLocation({ latitude: validLat, longitude: validLng });
      
      // Set Bortle scale to null until we get reliable data
      setBortleScale(null);
      
      // Get location information
      const locationInfo = await getLocationFromCoordinates(validLat, validLng, language);
      
      setLocationName(locationInfo.name);
      setFormattedLocationName(locationInfo.formattedName);
      
      // Get fresh Bortle scale data - don't rely on the one from locationInfo
      const bortleScaleValue = await getBortleScaleForLocation(
        validLat, 
        validLng, 
        locationInfo.name,
        setCachedData
      );
      
      setBortleScale(bortleScaleValue);
      
      const locationMessage = language === 'en' 
        ? `Location found: ${locationInfo.formattedName}` 
        : `位置已找到：${locationInfo.formattedName}`;
        
      const bortleMessage = bortleScaleValue === null
        ? (language === 'en' 
            ? " (Light pollution level unknown)" 
            : " (光污染水平未知)")
        : "";
        
      setStatusMessage(locationMessage + bortleMessage);
    } catch (error) {
      console.error("Error getting location:", error);
      setStatusMessage(
        language === 'en'
          ? "Could not determine exact location. Using approximate coordinates."
          : "无法确定确切位置。使用近似坐标。"
      );
    }
  }, [language, setCachedData]);

  const handleUseCurrentLocation = useCallback(() => {
    if (geo.loading) return;
    
    // Reset Bortle scale to ensure we don't display stale data
    setBortleScale(null);
    
    setStatusMessage(language === 'en' ? "Waiting for permission and location data..." : "等待位置权限和数据...");
    geo.getPosition();
  }, [geo, language]);

  return {
    loading: geo.loading,
    userLocation,
    locationName,
    formattedLocationName,
    latitude,
    longitude,
    bortleScale, // Now correctly returns null when unknown
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
