
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { fetchWeatherData, fetchLightPollutionData } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { calculateMoonPhase } from "@/utils/siqsValidation";

export const useNavigation = (locationId: string | null, beijingData: any, isLoading: boolean, setIsLoading: (value: boolean) => void) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // Precompute the navigation target for better performance
  const [navigateTarget, setNavigateTarget] = useState<string | null>(null);
  
  useEffect(() => {
    // If we already have a location ID, update the navigate target
    if (locationId && locationId.startsWith('/location/')) {
      setNavigateTarget(`/location/${locationId}`);
    } else if (beijingData) {
      setNavigateTarget(`/location/${beijingData.id}`);
    } else {
      setNavigateTarget("/#calculator-section");
    }
  }, [locationId, beijingData]);
  
  const handleSIQSClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If we're already on a location page, just stay there
    if (locationId && locationId.startsWith('/location/')) {
      return;
    }
    
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // If we already have Beijing data cached, use it immediately
      if (beijingData) {
        // Make sure we have valid weather data (not all zeros)
        const needsFreshData = !beijingData.weatherData || 
                              beijingData.weatherData.temperature === 0 || 
                              beijingData.weatherData.cloudCover === 0 || 
                              beijingData.weatherData.humidity === 0;
        
        if (needsFreshData) {
          // Get fresh weather data
          const beijing = {
            name: t("Beijing", "北京"),
            latitude: 39.9042,
            longitude: 116.4074
          };
          
          const freshWeatherData = await fetchWeatherData({
            latitude: beijing.latitude,
            longitude: beijing.longitude,
          });
          
          if (freshWeatherData) {
            // Update the cached Beijing data with fresh weather
            const updatedBeijingData = {
              ...beijingData,
              weatherData: freshWeatherData,
              timestamp: new Date().toISOString(),
            };
            
            // Recalculate SIQS with fresh data
            const moonPhase = calculateMoonPhase();
            
            const siqsResult = calculateSIQS({
              cloudCover: freshWeatherData.cloudCover,
              bortleScale: beijingData.bortleScale || 7,
              seeingConditions: beijingData.seeingConditions || 3,
              windSpeed: freshWeatherData.windSpeed,
              humidity: freshWeatherData.humidity,
              moonPhase,
              aqi: freshWeatherData.aqi,
              weatherCondition: freshWeatherData.weatherCondition
            });
            
            updatedBeijingData.siqsResult = siqsResult;
            updatedBeijingData.moonPhase = moonPhase;
            
            navigate(`/location/${beijingData.id}`, { 
              state: updatedBeijingData,
              replace: false 
            });
            
            // Also update localStorage
            try {
              localStorage.setItem(`location_${beijingData.id}`, JSON.stringify(updatedBeijingData));
            } catch (e) {
              console.error("Failed to save updated data to localStorage", e);
            }
          } else {
            // Use existing data if we couldn't fetch fresh data
            navigate(`/location/${beijingData.id}`, { 
              state: beijingData,
              replace: false 
            });
          }
        } else {
          // Use existing data
          navigate(`/location/${beijingData.id}`, { 
            state: beijingData,
            replace: false 
          });
        }
        
        setIsLoading(false);
        return;
      }
      
      // Default to Beijing coordinates
      const beijing = {
        name: t("Beijing", "北京"),
        latitude: 39.9042,
        longitude: 116.4074
      };
      
      // Force fresh weather data fetch - no caching here
      let weatherData;
      try {
        weatherData = await fetchWeatherData({
          latitude: beijing.latitude,
          longitude: beijing.longitude,
        });
        
        if (!weatherData || Object.keys(weatherData).length === 0) {
          throw new Error("Empty weather data");
        }
        
        // Verify all required fields are present and valid
        if (
          typeof weatherData.temperature !== 'number' || weatherData.temperature === 0 || 
          typeof weatherData.humidity !== 'number' || weatherData.humidity === 0 || 
          typeof weatherData.cloudCover !== 'number' || weatherData.cloudCover === 0 || 
          typeof weatherData.windSpeed !== 'number' || weatherData.windSpeed === 0
        ) {
          throw new Error("Invalid weather data fields");
        }
      } catch (weatherError) {
        console.error("Failed to fetch weather data:", weatherError);
        // Use fallback values that are more realistic than zeros
        weatherData = {
          temperature: 20,
          humidity: 50,
          cloudCover: 30,
          windSpeed: 10,
          precipitation: 0,
          time: new Date().toISOString(),
          condition: "Clear",
          weatherCondition: "Clear",
          aqi: 50
        };
        toast({
          title: t("Using offline data", "使用离线数据"),
          description: t("Could not fetch real-time weather. Using offline data instead.", "无法获取实时天气数据，使用离线数据替代。"),
          variant: "default"
        });
      }
      
      // Get Bortle scale with better error handling
      let bortleScale = 7; // Default for Beijing (urban area)
      
      try {
        const bortleData = await fetchLightPollutionData(beijing.latitude, beijing.longitude);
        if (bortleData?.bortleScale && bortleData.bortleScale >= 1 && bortleData.bortleScale <= 9) {
          bortleScale = bortleData.bortleScale;
        }
      } catch (error) {
        console.error("Error fetching light pollution data:", error);
        // Continue with default bortle scale
      }
      
      // Use our consistent moon phase calculation
      const moonPhase = calculateMoonPhase();
      
      const siqsResult = calculateSIQS({
        cloudCover: weatherData.cloudCover,
        bortleScale: bortleScale,
        seeingConditions: 3, // Average
        windSpeed: weatherData.windSpeed,
        humidity: weatherData.humidity,
        moonPhase,
        aqi: weatherData.aqi,
        weatherCondition: weatherData.weatherCondition
      });
      
      const locationId = Date.now().toString();
      
      const locationData = {
        id: locationId,
        name: beijing.name,
        latitude: beijing.latitude,
        longitude: beijing.longitude,
        bortleScale: bortleScale,
        seeingConditions: 3,
        weatherData: weatherData,
        siqsResult,
        moonPhase,
        timestamp: new Date().toISOString(),
      };
      
      // Also save to localStorage as backup
      try {
        localStorage.setItem(`location_${locationId}`, JSON.stringify(locationData));
      } catch (e) {
        console.error("Failed to save to localStorage", e);
      }
      
      // Use a more efficient navigation approach
      navigate(`/location/${locationId}`, { 
        state: locationData,
        replace: false 
      });
    } catch (error) {
      console.error("Error navigating to Beijing:", error);
      
      toast({
        title: t("Error", "错误"),
        description: t("Failed to load SIQS data. Redirecting to home.", "加载SIQS数据失败，正在重定向到首页。"),
        variant: "destructive"
      });
      
      // Fallback - just navigate to home calculator section
      navigate('/#calculator-section');
      setTimeout(() => {
        const calculatorSection = document.getElementById('calculator-section');
        if (calculatorSection) {
          calculatorSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };
  
  return { handleSIQSClick };
};
