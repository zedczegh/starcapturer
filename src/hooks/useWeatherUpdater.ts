
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export const useWeatherUpdater = () => {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  // Update light pollution data (Bortle scale, etc.)
  const updateLightPollutionData = useCallback(async (
    locationData: any,
    setLocationData: (data: any) => void,
    onSuccess?: () => void,
    onError?: (message: string) => void
  ) => {
    try {
      // Get existing values as fallbacks
      const existingBortle = locationData?.bortleScale;
      const existingName = locationData?.formattedName;
      const existingStreetName = locationData?.streetName;
      const existingTownName = locationData?.townName;
      const existingCityName = locationData?.cityName;
      
      // Import the necessary modules dynamically to reduce initial load time
      const [{ default: getLocationSkyQuality }] = await Promise.all([
        import("@/utils/location/skyQualityResolver")
      ]);
      
      // Get sky quality based on location
      const skyQualityData = await getLocationSkyQuality(
        locationData.latitude,
        locationData.longitude
      );
      
      // Preserve detailed location name if it exists
      const isDetailedName = existingName && 
                            !existingName.includes('°') && 
                            !existingName.includes('Location at') &&
                            !existingName.includes('Remote area') &&
                            (existingName.includes(',') || existingStreetName);
      
      // Update the location data with the new information, preserving detailed fields
      setLocationData({
        ...locationData,
        bortleScale: skyQualityData.bortleScale || existingBortle || 4,
        sqm: skyQualityData.sqm,
        nelm: skyQualityData.nelm,
        // Conditionally preserve detailed name and related fields
        ...(isDetailedName ? {
          formattedName: existingName,
          streetName: existingStreetName,
          townName: existingTownName,
          cityName: existingCityName
        } : {})
      });
      
      onSuccess?.();
    } catch (error) {
      console.error("Error updating light pollution data:", error);
      onError?.(t("Error updating location data", "更新位置数据时出错"));
    }
  }, [t]);

  // Refresh all weather and location data
  const handleRefreshAll = useCallback(async (
    locationData: any,
    setLocationData: (data: any) => void,
    onSuccess?: () => void,
    onError?: (message: string) => void
  ) => {
    if (!locationData || !locationData.latitude || !locationData.longitude) {
      onError?.(t("No location data available", "没有可用的位置数据"));
      return;
    }
    
    setLoading(true);
    try {
      // Preserve detailed location name
      const existingName = locationData?.formattedName;
      const existingStreetName = locationData?.streetName;
      const existingTownName = locationData?.townName;
      const existingCityName = locationData?.cityName;
      const existingCountyName = locationData?.countyName;
      const existingStateName = locationData?.stateName;
      
      // Check if we have a detailed name to preserve
      const isDetailedName = existingName && 
                            !existingName.includes('°') && 
                            !existingName.includes('Location at') &&
                            !existingName.includes('Remote area') &&
                            (existingName.includes(',') || existingStreetName);
      
      // Update light pollution data
      await updateLightPollutionData(locationData, (updatedData) => {
        // Preserve detailed name if we have one
        if (isDetailedName) {
          updatedData.formattedName = existingName;
          updatedData.streetName = existingStreetName;
          updatedData.townName = existingTownName;
          updatedData.cityName = existingCityName;
          updatedData.countyName = existingCountyName;
          updatedData.stateName = existingStateName;
        }
        
        setLocationData(updatedData);
      });
      
      onSuccess?.();
      
      toast.success(
        t("Weather data updated", "天气数据已更新"),
        {
          description: t("All information has been updated with the latest data.", "所有信息已更新为最新数据。")
        }
      );
    } catch (error) {
      console.error("Error refreshing all data:", error);
      onError?.(t("Error updating weather data", "更新天气数据时出错"));
      
      toast.error(
        t("Error updating weather data", "更新天气数据时出错"),
        {
          description: t("Please check your connection and try again", "请检查您的连接并重试")
        }
      );
    } finally {
      setLoading(false);
    }
  }, [t, updateLightPollutionData]);

  return {
    loading,
    setLoading,
    updateLightPollutionData,
    handleRefreshAll
  };
};
