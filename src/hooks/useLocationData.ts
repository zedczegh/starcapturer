
import { useState, useRef, useEffect } from "react";
import { fetchLightPollutionData, getLocationNameFromCoordinates } from "@/lib/api";

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
            const name = await getLocationNameFromCoordinates(lat, lng, language);
            console.log("Got location name:", name);
            setLocationName(name);
            
            try {
              const lightPollutionData = await fetchLightPollutionData(lat, lng);
              if (lightPollutionData && lightPollutionData.bortleScale) {
                setBortleScale(lightPollutionData.bortleScale);
                console.log("Got Bortle scale:", lightPollutionData.bortleScale);
                
                // Cache this data for future use
                setCachedData(cacheKey, {
                  name,
                  bortleScale: lightPollutionData.bortleScale
                });
              }
            } catch (lightError) {
              console.error("Error fetching light pollution data:", lightError);
              // Continue with default Bortle scale
            }
            
            setLoading(false);
            setStatusMessage(language === 'en' ? "Location found: " : "位置已找到：" + name);
          } catch (error) {
            console.error("Error getting location name:", error);
            const fallbackName = language === 'en'
              ? `Location at ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`
              : `位置：${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
            setLocationName(fallbackName);
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

export const estimateBortleScale = (locationName: string): number => {
  const lowercaseName = locationName.toLowerCase();
  
  if (
    lowercaseName.includes('city') || 
    lowercaseName.includes('downtown') || 
    lowercaseName.includes('urban') ||
    lowercaseName.includes('metro')
  ) {
    return 8;
  }
  
  if (
    lowercaseName.includes('suburb') || 
    lowercaseName.includes('residential') || 
    lowercaseName.includes('town')
  ) {
    return 6;
  }
  
  if (
    lowercaseName.includes('rural') || 
    lowercaseName.includes('village') || 
    lowercaseName.includes('countryside')
  ) {
    return 4;
  }
  
  if (
    lowercaseName.includes('park') || 
    lowercaseName.includes('forest') || 
    lowercaseName.includes('national') ||
    lowercaseName.includes('desert') ||
    lowercaseName.includes('mountain') ||
    lowercaseName.includes('remote') ||
    lowercaseName.includes('wilderness')
  ) {
    return 3;
  }
  
  return 5;
};
