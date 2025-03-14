
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import LocationError from "@/components/location/LocationError";
import LocationDetailsViewport from "@/components/location/LocationDetailsViewport";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useLocationUpdate } from "@/hooks/useLocationUpdate";
import { calculateMoonPhase } from "@/utils/siqsValidation";
import { fetchWeatherData } from "@/lib/api";

const LocationDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [locationData, setLocationData] = useState<any>(null);
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { loading, handleLocationUpdate } = useLocationUpdate(locationData, setLocationData);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info');

  // Optimize data initialization - only run once when component mounts
  useEffect(() => {
    if (!locationData) {
      if (location.state) {
        console.log("Setting location data from state:", location.state);
        
        // Check if weatherData is missing or has zeros for critical values
        const needsWeatherUpdate = 
          !location.state.weatherData || 
          location.state.weatherData.temperature === 0 || 
          location.state.weatherData.humidity === 0 || 
          location.state.weatherData.cloudCover === 0 || 
          location.state.weatherData.windSpeed === 0;
        
        // Ensure location data has fresh moon phase
        const dataWithFreshMoonPhase = {
          ...location.state,
          moonPhase: location.state.moonPhase || calculateMoonPhase()
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
        if (needsWeatherUpdate && location.state.latitude && location.state.longitude) {
          (async () => {
            try {
              const freshWeatherData = await fetchWeatherData({
                latitude: location.state.latitude,
                longitude: location.state.longitude
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
          })();
        }
        
        if (!location.state?.latitude || !location.state?.longitude) {
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
        try {
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
              (async () => {
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
              })();
            }
            
            return;
          }
        } catch (e) {
          console.error("Failed to load from localStorage", e);
        }
        
        console.error("Location data is missing", { params: id, locationState: location.state });
        
        toast({
          title: t("Error", "错误"),
          description: t("Location data not found", "找不到位置数据"),
          variant: "destructive"
        });
      }
    }
  }, [locationData, location.state, navigate, t, id, toast, language]);

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

  if (!locationData) {
    return <LocationError />;
  }

  return (
    <LocationDetailsViewport 
      locationData={locationData}
      setLocationData={setLocationData}
      statusMessage={statusMessage}
      messageType={messageType}
      setStatusMessage={setStatusMessage}
      handleUpdateLocation={handleUpdateLocation}
    />
  );
};

export default LocationDetails;
