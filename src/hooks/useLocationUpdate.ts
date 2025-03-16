
import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchWeatherData } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { useLightPollutionData } from "./useLightPollutionData";
import { hasProperty } from "@/types/weather-utils";
import { useBortleUpdater } from "./location/useBortleUpdater";
import { getCityBortleScale, isInChina } from "@/utils/chinaBortleData";

/**
 * Hook for handling location updates with improved handling for Chinese regions
 */
export const useLocationUpdate = (
  locationData: any,
  setLocationData: (data: any) => void
) => {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const { updateLightPollutionData } = useLightPollutionData();
  const { updateBortleScale } = useBortleUpdater();
  const updateInProgressRef = useRef(false);
  const lastLocationRef = useRef<{latitude: number, longitude: number} | null>(null);
  
  // Check if the location is significantly different from the last one (> 500m)
  const isSignificantLocationChange = (
    newLat: number, 
    newLng: number
  ): boolean => {
    if (!lastLocationRef.current) return true;
    
    const { latitude: lastLat, longitude: lastLng } = lastLocationRef.current;
    
    // Quick distance approximation (good enough for this purpose)
    const latDiff = Math.abs(newLat - lastLat);
    const lngDiff = Math.abs(newLng - lastLng);
    
    // ~111km per degree of latitude, ~111km * cos(lat) per degree of longitude
    // 0.005 degrees ≈ 500m
    return latDiff > 0.005 || lngDiff > 0.005;
  };

  const handleLocationUpdate = useCallback(
    async (newLocation: { name: string; latitude: number; longitude: number }) => {
      if (!newLocation) return;
      
      // Prevent multiple simultaneous updates
      if (updateInProgressRef.current) {
        console.log("Update already in progress, skipping");
        return;
      }
      
      // Skip if the location isn't significantly different
      if (!isSignificantLocationChange(newLocation.latitude, newLocation.longitude)) {
        console.log("Location change too small, skipping update");
        return locationData;
      }
      
      // Update the last location reference
      lastLocationRef.current = {
        latitude: newLocation.latitude,
        longitude: newLocation.longitude
      };
      
      updateInProgressRef.current = true;
      setLoading(true);
      
      try {
        console.log("Location update received:", newLocation);
        
        // Get new weather data for the updated location
        let newWeatherData;
        try {
          newWeatherData = await fetchWeatherData({
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
          });
        } catch (error) {
          console.error("Error fetching weather data:", error);
          // If weather API fails, use default weather data
          newWeatherData = {
            temperature: 20,
            humidity: 50,
            cloudCover: 30,
            windSpeed: 5,
            precipitation: 0,
            weatherCondition: "Clear",
            time: new Date().toISOString(),
            aqi: 50
          };
        }
        
        // First check for specific city Bortle scale in our comprehensive database
        let bortleScale: number | null = getCityBortleScale(
          newLocation.latitude, 
          newLocation.longitude
        );
        
        // If not a specific city, check if we're in China
        if (bortleScale === null) {
          const inChina = isInChina(newLocation.latitude, newLocation.longitude);
          
          // For Chinese locations, always get fresh Bortle scale data
          if (inChina) {
            console.log("Chinese location detected, fetching accurate Bortle data");
            bortleScale = await updateBortleScale(
              newLocation.latitude, 
              newLocation.longitude, 
              newLocation.name, 
              null // Force refresh for Chinese locations
            );
            console.log("Updated Bortle scale for location in China:", bortleScale);
          } else {
            // For other regions, reuse existing if available
            bortleScale = hasProperty(locationData, 'bortleScale') ? locationData.bortleScale : null;
            
            // If no existing value, get a new one
            if (bortleScale === null || bortleScale === undefined) {
              try {
                const { fetchLightPollutionData } = await import("@/lib/api");
                const bortleData = await fetchLightPollutionData(
                  newLocation.latitude, 
                  newLocation.longitude
                );
                if (bortleData?.bortleScale) {
                  bortleScale = bortleData.bortleScale;
                }
              } catch (error) {
                console.error("Error fetching light pollution data:", error);
                // Continue with existing bortle scale
              }
            }
          }
        } else {
          console.log("Using specific city Bortle scale from database:", bortleScale);
        }
        
        // Calculate new SIQS score
        const seeingConditions = hasProperty(locationData, 'seeingConditions') ? locationData.seeingConditions : 3;
        
        const siqsResult = calculateSIQS({
          cloudCover: newWeatherData.cloudCover,
          bortleScale: bortleScale !== null ? bortleScale : 4,
          seeingConditions: seeingConditions,
          windSpeed: newWeatherData.windSpeed,
          humidity: newWeatherData.humidity,
          moonPhase: locationData.moonPhase,
          aqi: newWeatherData.aqi,
          weatherCondition: newWeatherData.weatherCondition,
          precipitation: newWeatherData.precipitation
        });
        
        // Update location data with new information
        const updatedLocationData = {
          ...locationData,
          name: newLocation.name,
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          weatherData: newWeatherData,
          bortleScale,
          siqsResult,
          timestamp: new Date().toISOString()
        };
        
        setLocationData(updatedLocationData);
        
        // Show success toast
        toast.success(t("Location updated successfully", "位置更新成功"));
        
        return updatedLocationData;
      } catch (error) {
        console.error("Error updating location:", error);
        toast.error(t("Failed to update location", "位置更新失败"));
        throw error;
      } finally {
        setLoading(false);
        // Add a delay before allowing another update
        setTimeout(() => {
          updateInProgressRef.current = false;
        }, 1000);
      }
    },
    [locationData, setLocationData, t, updateBortleScale]
  );

  return {
    loading,
    handleLocationUpdate
  };
};
