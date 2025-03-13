
import { useState, useRef, useEffect } from "react";
import { fetchLightPollutionData, getLocationNameFromCoordinates } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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
              } else {
                // If we can't get Bortle scale from API, estimate it
                const estimatedScale = estimateBortleScale(name);
                setBortleScale(estimatedScale);
                
                setCachedData(cacheKey, {
                  name,
                  bortleScale: estimatedScale
                });
              }
            } catch (lightError) {
              console.error("Error fetching light pollution data:", lightError);
              
              // Estimate Bortle scale based on location name
              const estimatedScale = estimateBortleScale(name);
              setBortleScale(estimatedScale);
              
              setCachedData(cacheKey, {
                name,
                bortleScale: estimatedScale
              });
              
              toast({
                title: language === 'en' ? "Using estimated Bortle scale" : "使用估算的伯特尔尺度",
                description: language === 'en'
                  ? "Could not fetch light pollution data. Using estimated value based on location type."
                  : "无法获取光污染数据。使用基于位置类型的估算值。"
              });
            }
            
            setLoading(false);
            setStatusMessage(language === 'en' ? "Location found: " : "位置已找到：" + name);
          } catch (error) {
            console.error("Error getting location name:", error);
            const fallbackName = language === 'en'
              ? `Location at ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`
              : `位置：${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
            setLocationName(fallbackName);
            
            // Estimate Bortle scale conservatively for unknown locations
            setBortleScale(5);
            
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

// Improved Bortle scale estimation for different location types
export const estimateBortleScale = (locationName: string): number => {
  if (!locationName) return 5; // Default moderate value
  
  const lowercaseName = locationName.toLowerCase();
  
  // Major urban centers - very high light pollution
  if (
    /\b(beijing|shanghai|tokyo|new york|nyc|los angeles|london|paris|chicago|seoul|mumbai|delhi|mexico city|cairo|singapore)\b/.test(lowercaseName) ||
    lowercaseName.includes('downtown') ||
    lowercaseName.includes('city center')
  ) {
    return 8; // Class 8: Urban center
  }
  
  // Urban areas
  if (
    lowercaseName.includes('city') || 
    lowercaseName.includes('urban') ||
    lowercaseName.includes('metro') ||
    lowercaseName.includes('municipal')
  ) {
    return 7; // Class 7: Urban area
  }
  
  // Suburban areas
  if (
    lowercaseName.includes('suburb') || 
    lowercaseName.includes('residential') || 
    lowercaseName.includes('borough') ||
    lowercaseName.includes('district')
  ) {
    return 6; // Class 6: Suburban
  }
  
  // Small towns and villages
  if (
    lowercaseName.includes('town') ||
    lowercaseName.includes('township') ||
    lowercaseName.includes('village')
  ) {
    return 5; // Class 5: Small town
  }
  
  // Rural areas
  if (
    lowercaseName.includes('rural') || 
    lowercaseName.includes('countryside') ||
    lowercaseName.includes('farmland') ||
    lowercaseName.includes('agricultural')
  ) {
    return 4; // Class 4: Rural area
  }
  
  // Natural areas
  if (
    lowercaseName.includes('park') || 
    lowercaseName.includes('forest') || 
    lowercaseName.includes('national') ||
    lowercaseName.includes('reserve') ||
    lowercaseName.includes('preserve')
  ) {
    return 3; // Class 3: Natural area
  }
  
  // Remote areas
  if (
    lowercaseName.includes('desert') ||
    lowercaseName.includes('mountain') ||
    lowercaseName.includes('remote') ||
    lowercaseName.includes('wilderness') ||
    lowercaseName.includes('isolated')
  ) {
    return 2; // Class 2: Remote area
  }
  
  // Default - moderate light pollution assumption
  return 5; // Class 5 as default
};
