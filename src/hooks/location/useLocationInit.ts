import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateMoonPhase } from "@/utils/siqsValidation";
import { fetchWeatherData } from "@/lib/api";
import { NavigateFunction } from "react-router-dom";

/**
 * Handles location changes and updates with proper data fetching
 */
export const handleLocationChange = async (
  latitude: number,
  longitude: number,
  name: string,
  language: string = 'en'
): Promise<any> => {
  try {
    // Fetch weather data for the new location
    const weatherData = await fetchWeatherData({
      latitude,
      longitude
    });
    
    // Calculate moon phase
    const moonPhase = calculateMoonPhase();
    
    // Return the updated location data
    return {
      name,
      latitude,
      longitude,
      weatherData,
      moonPhase,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error updating location:", error);
    throw new Error("Failed to update location data");
  }
};

/**
 * Hook to initialize location data from state or localStorage
 */
export const useLocationInit = (
  id: string | undefined,
  initialState: any,
  navigate: NavigateFunction
) => {
  const [locationData, setLocationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { t, language } = useLanguage();
  const { toast } = useToast();

  // Initialize location data from state or localStorage
  useEffect(() => {
    async function initializeLocationData() {
      if (locationData) {
        setIsLoading(false);
        return;
      }

      try {
        // First priority: use initialState passed from the router
        if (initialState && initialState.latitude && initialState.longitude) {
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
              console.log("Updating weather data for location:", initialState.name);
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
        } else if (id) {
          // Second priority: try to load data from localStorage if available
          console.log("Trying to load location data from localStorage for ID:", id);
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
                console.log("Updating weather data for stored location:", parsedData.name);
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
                    localStorage.setItem(`location_${id}`, JSON.stringify(updatedData));
                  } catch (e) {
                    console.error("Failed to save updated data to localStorage", e);
                  }
                }
              } catch (error) {
                console.error("Failed to update weather data:", error);
              }
            }
          } else {
            console.error("Location data not found in localStorage", { id });
            
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
        } else {
          console.error("No way to initialize location data", { params: id, locationState: initialState });
          
          toast({
            title: t("Error", "错误"),
            description: t("Cannot load location details", "无法加载位置详情"),
            variant: "destructive"
          });
          
          // Redirect after showing the error
          setTimeout(() => {
            navigate("/");
          }, 2000);
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

  return {
    locationData,
    setLocationData,
    isLoading
  };
};
