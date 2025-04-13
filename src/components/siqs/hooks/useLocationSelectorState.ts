
import { useState, useCallback, useEffect } from "react";
import { fetchLightPollutionData } from "@/lib/api";
import { estimateBortleScale } from "@/hooks/location/useBortleScale";

interface CachedLocationData {
  name?: string;
  formattedName?: string;
  bortleScale?: number | null;
}

interface UseLocationSelectorStateProps {
  language: string;
  noAutoLocationRequest: boolean;
  bortleScale: number | null;
  setBortleScale: (scale: number | null) => void;
  setStatusMessage: (message: string | null) => void;
  setShowAdvancedSettings: (show: boolean) => void;
  getCachedData: (key: string, maxAge?: number) => CachedLocationData | null;
  setCachedData: (key: string, data: CachedLocationData) => void;
}

interface Location {
  name: string;
  latitude: number;
  longitude: number;
  placeDetails?: string;
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
  const [hasTriedStoredLocation, setHasTriedStoredLocation] = useState(false);
  
  // Try to restore previous location when component initializes
  useEffect(() => {
    if (hasTriedStoredLocation || locationName || latitude || longitude) {
      return; // Already initialized or tried
    }
    
    try {
      const storedLocationStr = localStorage.getItem('latest_siqs_location');
      if (storedLocationStr) {
        const storedLocation = JSON.parse(storedLocationStr);
        if (storedLocation && storedLocation.name && 
            typeof storedLocation.latitude === 'number' &&
            typeof storedLocation.longitude === 'number') {
          
          // Restore the saved location
          setLocationName(storedLocation.name);
          setLatitude(storedLocation.latitude.toString());
          setLongitude(storedLocation.longitude.toString());
          setShowAdvancedSettings(true);
          
          // Update Bortle scale based on the restored location
          if (bortleScale === null) {
            fetchLightPollutionData(storedLocation.latitude, storedLocation.longitude)
              .then(data => {
                if (data && data.bortleScale !== undefined) {
                  setBortleScale(data.bortleScale);
                }
              })
              .catch(error => {
                console.error("Error fetching Bortle scale for restored location:", error);
              });
          }
        }
      }
    } catch (error) {
      console.error("Error restoring location:", error);
    } finally {
      setHasTriedStoredLocation(true);
    }
  }, [hasTriedStoredLocation, locationName, latitude, longitude, bortleScale, setBortleScale, setShowAdvancedSettings]);
  
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
  }, [language, setStatusMessage, setShowAdvancedSettings, setBortleScale]);
  
  // Update this to use the location object parameter
  const handleLocationSelect = useCallback(async (location: Location) => {
    setLocationName(location.name);
    setLatitude(location.latitude.toFixed(6));
    setLongitude(location.longitude.toFixed(6));
    
    // Reset Bortle scale until we get fresh data
    setBortleScale(null);
    
    // Save as latest location
    try {
      localStorage.setItem('latest_siqs_location', JSON.stringify({
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude
      }));
    } catch (error) {
      console.error("Error saving selected location to localStorage:", error);
    }
    
    const cacheKey = `loc-${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData && cachedData.bortleScale !== undefined) {
      setBortleScale(cachedData.bortleScale);
      setStatusMessage(language === 'en' 
        ? `Selected location: ${location.name}` 
        : `已选择位置：${location.name}`);
      setShowAdvancedSettings(true);
      return;
    }
    
    try {
      const lightPollutionData = await fetchLightPollutionData(location.latitude, location.longitude);
      if (lightPollutionData && lightPollutionData.bortleScale !== undefined) {
        setBortleScale(lightPollutionData.bortleScale);
        
        setCachedData(cacheKey, {
          name: location.name,
          bortleScale: lightPollutionData.bortleScale
        });
      } else {
        // If we couldn't get light pollution data, set to null and inform user
        setBortleScale(null);
        setStatusMessage(language === 'en'
          ? `Light pollution data unavailable for ${location.name}`
          : `无法获取${location.name}的光污染数据`);
        
        setCachedData(cacheKey, {
          name: location.name,
          bortleScale: null
        });
      }
    } catch (error) {
      console.error("Error fetching light pollution data for selected location:", error);
      try {
        const estimatedBortleScale = estimateBortleScale(location.name);
        if (estimatedBortleScale >= 1 && estimatedBortleScale <= 9) {
          setBortleScale(estimatedBortleScale);
          setCachedData(cacheKey, {
            name: location.name,
            bortleScale: estimatedBortleScale
          });
        } else {
          setBortleScale(null);
          setCachedData(cacheKey, {
            name: location.name,
            bortleScale: null
          });
        }
      } catch (estimationError) {
        setBortleScale(null);
        console.error("Error estimating Bortle scale:", estimationError);
      }
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
    
    // Save as latest location
    try {
      localStorage.setItem('latest_siqs_location', JSON.stringify({
        name: point.name,
        latitude: point.latitude,
        longitude: point.longitude
      }));
    } catch (error) {
      console.error("Error saving recommended location to localStorage:", error);
    }
    
    // Reset Bortle scale until we get fresh data
    setBortleScale(null);
    
    setShowAdvancedSettings(true);
    setStatusMessage(language === 'en' 
      ? `Selected recommended location: ${point.name}` 
      : `已选择推荐位置：${point.name}`);
  }, [language, setStatusMessage, setShowAdvancedSettings, setBortleScale]);
  
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
