
import { useState, useEffect } from "react";
import { getLocationNameFromCoordinates } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { findClosestKnownLocation } from "@/utils/bortleScaleEstimation";
import { useLocationDataCache } from "./location/useLocationCache";
import { useGeolocation } from "./location/useGeolocation";
import { getBortleScaleForLocation } from "./location/useBortleScale";
import { useLanguage } from "@/contexts/LanguageContext";

export { useLocationDataCache } from "./location/useLocationCache";
export { estimateBortleScale } from "./location/useBortleScale";

export const useCurrentLocation = (language: string, noAutoLocationRequest: boolean = false) => {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationName, setLocationName] = useState("");
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
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
    setUserLocation({ latitude: lat, longitude: lng });
    
    // Check for cached data
    const cacheKey = `loc-${lat.toFixed(4)}-${lng.toFixed(4)}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      setLocationName(cachedData.name);
      setBortleScale(cachedData.bortleScale);
      setStatusMessage(language === 'en' ? "Location found: " : "位置已找到：" + cachedData.name);
      return;
    }
    
    try {
      // First, try our own database for better location names
      const closestLocation = findClosestKnownLocation(lat, lng);
      let name;
      
      // If location is within 20km of a known location, use that name
      if (closestLocation.distance <= 20) {
        name = closestLocation.name;
        setBortleScale(closestLocation.bortleScale);
        console.log("Got location from database:", name, "Bortle:", closestLocation.bortleScale);
      } else {
        // Otherwise try to get a name from API
        name = await getLocationNameFromCoordinates(lat, lng, language);
        console.log("Got location name from API:", name);
        
        // Get Bortle scale
        const scale = await getBortleScaleForLocation(lat, lng, name, setCachedData);
        setBortleScale(scale);
      }
      
      // If name still contains coordinates, try to get a friendlier name
      if (name && (name.includes("Location at") || name.includes("("))) {
        // Try to get a better name one more time
        try {
          const friendlyName = await getLocationNameFromCoordinates(lat, lng, language);
          if (friendlyName && !friendlyName.includes("Location")) {
            name = friendlyName;
          }
        } catch (error) {
          console.warn("Error getting friendly location name:", error);
          // Continue with the name we have
        }
      }
      
      setLocationName(name);
      
      // Cache this data for future use
      setCachedData(cacheKey, {
        name,
        bortleScale
      });
      
      setStatusMessage(language === 'en' ? "Location found: " : "位置已找到：" + name);
    } catch (error) {
      console.error("Error getting location name:", error);
      // Use our closest known location from the database as a fallback
      const closestLocation = findClosestKnownLocation(lat, lng);
      const fallbackName = closestLocation.distance <= 50 
        ? closestLocation.name
        : (language === 'en'
          ? `${t("Location near", "位置在附近")}: ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`
          : `${t("Location near", "位置在附近")}: ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`);
              
      setLocationName(fallbackName);
      
      // Use our Bortle scale database
      setBortleScale(closestLocation.bortleScale);
      
      setStatusMessage(language === 'en' ? "Location found: " : "位置已找到：" + fallbackName);
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
