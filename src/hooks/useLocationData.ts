import { useState, useRef, useEffect } from "react";
import { fetchLightPollutionData, getLocationNameFromCoordinates } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { findClosestKnownLocation } from "@/utils/bortleScaleEstimation";

// Cache data between renders to improve performance
export const useLocationDataCache = () => {
  const [cache, setCache] = useState<Record<string, any>>({});
  
  const setCachedData = (key: string, data: any) => {
    setCache(prev => ({
      ...prev,
      [key]: {
        data,
        timestamp: Date.now()
      }
    }));
  };
  
  const getCachedData = (key: string, maxAge = 5 * 60 * 1000) => {
    const cached = cache[key];
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > maxAge) return null;
    
    return cached.data;
  };
  
  return { setCachedData, getCachedData };
};

export const useCurrentLocation = (language: string, noAutoLocationRequest: boolean = false) => {
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [bortleScale, setBortleScale] = useState(4);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const locationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setCachedData, getCachedData } = useLocationDataCache();
  const { toast } = useToast();

  const handleUseCurrentLocation = () => {
    if (loading) return;
    
    if (navigator.geolocation) {
      setLoading(true);
      setStatusMessage(language === 'en' ? "Waiting for permission and location data..." : "等待位置权限和数据...");
      
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
      }
      
      locationTimeoutRef.current = setTimeout(() => {
        if (loading) {
          setLoading(false);
          setStatusMessage(language === 'en' ? "Location request timed out. Please try again or enter coordinates manually." : 
            "位置请求超时。请重试或手动输入坐标。");
        }
      }, 15000);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (locationTimeoutRef.current) {
            clearTimeout(locationTimeoutRef.current);
            locationTimeoutRef.current = null;
          }
          
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setLatitude(lat.toFixed(6));
          setLongitude(lng.toFixed(6));
          setUserLocation({ latitude: lat, longitude: lng });
          
          // Check if we have cached data for this location
          const cacheKey = `loc-${lat.toFixed(4)}-${lng.toFixed(4)}`;
          const cachedData = getCachedData(cacheKey);
          
          if (cachedData) {
            setLocationName(cachedData.name);
            setBortleScale(cachedData.bortleScale);
            setLoading(false);
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
              
              try {
                const lightPollutionData = await fetchLightPollutionData(lat, lng);
                if (lightPollutionData && lightPollutionData.bortleScale) {
                  setBortleScale(lightPollutionData.bortleScale);
                  console.log("Got Bortle scale:", lightPollutionData.bortleScale);
                }
              } catch (lightError) {
                console.error("Error fetching light pollution data:", lightError);
                // Use our Bortle scale database as fallback
                const estimatedScale = findClosestKnownLocation(lat, lng).bortleScale;
                setBortleScale(estimatedScale);
                console.log("Using estimated Bortle scale:", estimatedScale);
              }
            }
            
            setLocationName(name);
            
            // Cache this data for future use
            setCachedData(cacheKey, {
              name,
              bortleScale
            });
            
            setLoading(false);
            setStatusMessage(language === 'en' ? "Location found: " : "位置已找到：" + name);
          } catch (error) {
            console.error("Error getting location name:", error);
            // Use our closest known location from the database as a fallback
            const closestLocation = findClosestKnownLocation(lat, lng);
            const fallbackName = closestLocation.distance <= 50 
              ? closestLocation.name
              : (language === 'en'
                ? `Location at ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`
                : `位置：${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
                
            setLocationName(fallbackName);
            
            // Use our Bortle scale database
            setBortleScale(closestLocation.bortleScale);
            
            setLoading(false);
            setStatusMessage(language === 'en' ? "Location found: " : "位置已找到：" + fallbackName);
          }
        },
        (error) => {
          if (locationTimeoutRef.current) {
            clearTimeout(locationTimeoutRef.current);
            locationTimeoutRef.current = null;
          }
          
          setLoading(false);
          
          let errorMessage = "";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = language === 'en'
                ? "Location permission denied. Please check your browser settings."
                : "位置权限被拒绝。请检查您的浏览器设置。";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = language === 'en'
                ? "Location information is unavailable. Try another method."
                : "位置信息不可用。请尝试其他方法。";
              break;
            case error.TIMEOUT:
              errorMessage = language === 'en'
                ? "Location request timed out. Please try again."
                : "位置请求超时。请重试。";
              break;
            default:
              errorMessage = language === 'en'
                ? "An unknown error occurred while getting your location."
                : "获取位置时发生未知错误。";
          }
          
          setStatusMessage(errorMessage);
          console.error("Geolocation error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0
        }
      );
    } else {
      setStatusMessage(language === 'en' ? "Your browser doesn't support geolocation. Please enter coordinates manually."
        : "您的浏览器不支持地理位置，请手动输入坐标。");
    }
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
      }
    };
  }, []);

  return {
    loading,
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
    handleUseCurrentLocation
  };
};

// Import the improved Bortle scale estimation function
export const estimateBortleScale = (locationName: string): number => {
  if (!locationName) return 5; // Default moderate value
  
  const { estimateBortleScaleByLocation } = require("@/utils/bortleScaleEstimation");
  return estimateBortleScaleByLocation(locationName);
};
