
import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useLocationUpdate } from "@/hooks/useLocationUpdate";
import { calculateMoonPhase } from "@/utils/siqsValidation";
import { fetchWeatherData } from "@/lib/api";
import { NavigateFunction } from "react-router-dom";

interface UseLocationDataManagerProps {
  id: string | undefined;
  initialState: any;
  navigate: NavigateFunction;
}

export const useLocationDataManager = ({ 
  id, 
  initialState, 
  navigate 
}: UseLocationDataManagerProps) => {
  const [locationData, setLocationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info');
  
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { loading, handleLocationUpdate } = useLocationUpdate(locationData, setLocationData);

  // Initialize location data from state or localStorage
  useEffect(() => {
    async function initializeLocationData() {
      if (locationData) {
        setIsLoading(false);
        return;
      }

      try {
        if (initialState) {
          console.log("Setting location data from state:", initialState);
          
          // Check if weatherData is missing or has zeros for critical values
          const needsWeatherUpdate = 
            !initialState.weatherData || 
            initialState.weatherData.temperature === 0 || 
            initialState.weatherData.humidity === 0 || 
            initialState.weatherData.cloudCover === 0 || 
            initialState.weatherData.windSpeed === 0;
          
          // Ensure location data has fresh moon phase
          const dataWithFreshMoonPhase = {
            ...initialState,
            moonPhase: initialState.moonPhase || calculateMoonPhase()
          };
          
          setLocationData(dataWithFreshMoonPhase);
          
          // Also save to localStorage for persistence
          try {
            if (id) {
              localStorage.setItem(`location_${id}`, JSON.stringify(dataWithFreshMoonPhase));
            }
          } catch (e) {
            console.error("Failed to save to localStorage", e);
          }
          
          // If weatherData needs to be updated, trigger it immediately
          if (needsWeatherUpdate && initialState.latitude && initialState.longitude) {
            try {
              const freshWeatherData = await fetchWeatherData({
                latitude: initialState.latitude,
                longitude: initialState.longitude
              });
              
              if (freshWeatherData) {
                const updatedData = {
                  ...dataWithFreshMoonPhase,
                  weatherData: freshWeatherData,
                  timestamp: new Date().toISOString()
                };
                
                setLocationData(updatedData);
                
                // Update localStorage
                try {
                  if (id) {
                    localStorage.setItem(`location_${id}`, JSON.stringify(updatedData));
                  }
                } catch (e) {
                  console.error("Failed to save updated data to localStorage", e);
                }
              }
            } catch (error) {
              console.error("Failed to update weather data:", error);
            }
          }
          
          if (!initialState?.latitude || !initialState?.longitude) {
            toast({
              title: t("Error", "错误"),
              description: t("Incomplete location data", "位置数据不完整"),
              variant: "destructive"
            });
            
            const redirectTimer = setTimeout(() => {
              navigate("/");
            }, 2000);
            
            return () => clearTimeout(redirectTimer);
          }
        } else {
          // Try to load data from localStorage if available
          const savedLocationData = localStorage.getItem(`location_${id}`);
          if (savedLocationData) {
            const parsedData = JSON.parse(savedLocationData);
            
            // Ensure we have a fresh moon phase
            parsedData.moonPhase = parsedData.moonPhase || calculateMoonPhase();
            
            // Check if we need to update weather data
            const needsWeatherUpdate = 
              !parsedData.weatherData || 
              parsedData.weatherData.temperature === 0 || 
              parsedData.weatherData.humidity === 0 || 
              parsedData.weatherData.cloudCover === 0 || 
              parsedData.weatherData.windSpeed === 0;
            
            setLocationData(parsedData);
            
            // If weatherData needs to be updated, trigger it immediately
            if (needsWeatherUpdate && parsedData.latitude && parsedData.longitude) {
              try {
                const freshWeatherData = await fetchWeatherData({
                  latitude: parsedData.latitude,
                  longitude: parsedData.longitude
                });
                
                if (freshWeatherData) {
                  const updatedData = {
                    ...parsedData,
                    weatherData: freshWeatherData,
                    timestamp: new Date().toISOString()
                  };
                  
                  setLocationData(updatedData);
                  
                  // Update localStorage
                  try {
                    if (id) {
                      localStorage.setItem(`location_${id}`, JSON.stringify(updatedData));
                    }
                  } catch (e) {
                    console.error("Failed to save updated data to localStorage", e);
                  }
                }
              } catch (error) {
                console.error("Failed to update weather data:", error);
              }
            }
          } else {
            console.error("Location data is missing", { params: id, locationState: initialState });
            
            toast({
              title: t("Error", "错误"),
              description: t("Location data not found", "找不到位置数据"),
              variant: "destructive"
            });
            
            // Redirect after showing the error
            setTimeout(() => {
              navigate("/");
            }, 2000);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }

    initializeLocationData();
  }, [id, initialState, navigate, t, toast, language]);

  // Cache location data in localStorage for better persistence
  useEffect(() => {
    if (locationData && id) {
      try {
        localStorage.setItem(`location_${id}`, JSON.stringify(locationData));
      } catch (e) {
        console.error("Failed to save to localStorage", e);
      }
    }
  }, [locationData, id]);

  const handleUpdateLocation = useCallback(async (newLocation: { name: string; latitude: number; longitude: number }) => {
    try {
      await handleLocationUpdate(newLocation);
      setStatusMessage(t("SIQS score has been recalculated for the new location.", 
                   "已为新位置重新计算SIQS评分。"));
      setMessageType('success');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      setStatusMessage(t("Failed to update location and recalculate SIQS score. Please try again.", 
                   "无法更新位置并重新计算SIQS评分。请重试。"));
      setMessageType('error');                   
    }
  }, [handleLocationUpdate, t]);

  return {
    locationData,
    setLocationData,
    statusMessage,
    messageType,
    setStatusMessage,
    handleUpdateLocation,
    isLoading
  };
};
