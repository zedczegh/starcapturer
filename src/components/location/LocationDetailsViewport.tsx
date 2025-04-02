
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LocationDetailsHeader from "./LocationDetailsHeader";
import LocationContentGrid from "./LocationContentGrid";
import LocationStatusMessage from "./LocationStatusMessage";
import { useWeatherUpdater } from "@/hooks/useWeatherUpdater";
import { useForecastManager } from "@/hooks/locationDetails/useForecastManager";
import { formatDate, formatTime } from "@/components/forecast/ForecastUtils";
import WeatherAlerts from "@/components/weather/WeatherAlerts";
import BackButton from "@/components/navigation/BackButton";
import { useRefreshManager } from "@/hooks/location/useRefreshManager";
import { useLocationSIQSUpdater } from "@/hooks/useLocationSIQSUpdater";

interface LocationDetailsViewportProps {
  locationData: any;
  setLocationData: React.Dispatch<React.SetStateAction<any>>;
  statusMessage: string | null;
  messageType: "info" | "error" | "success" | null;
  setStatusMessage: React.Dispatch<React.SetStateAction<string | null>>;
  handleUpdateLocation: (updatedData: any) => Promise<void>;
}

const LocationDetailsViewport: React.FC<LocationDetailsViewportProps> = ({
  locationData,
  setLocationData,
  statusMessage,
  messageType,
  setStatusMessage,
  handleUpdateLocation
}) => {
  const [gettingUserLocation, setGettingUserLocation] = useState(false);
  const { language, t } = useLanguage();
  
  // Handle refreshing of data
  const handleRefresh = useCallback(async () => {
    try {
      setStatusMessage(t("Refreshing data...", "正在刷新数据..."));
      await handleUpdateLocation(locationData);
      setStatusMessage(null);
    } catch (error) {
      console.error("Failed to refresh:", error);
      setStatusMessage(t("Failed to refresh data", "刷新数据失败"));
    }
  }, [handleUpdateLocation, locationData, setStatusMessage, t]);
  
  // Weather updates
  const { 
    updateWeatherWithForecast,
    shouldDisplayRefreshButton,
    getLastWeatherUpdateTime 
  } = useWeatherUpdater();
  
  // Forecast management
  const { 
    forecast, 
    loading: forecastLoading, 
    error: forecastError,
    fetchForecast
  } = useForecastManager(locationData);
  
  // SIQS updater
  const { updateSIQS, siqs: updatedSiqs } = useLocationSIQSUpdater();
  
  // Auto refresh when needed
  const { shouldRefresh, markRefreshComplete } = useRefreshManager(locationData);
  
  // Update SIQS when forecast changes
  useEffect(() => {
    if (forecast && locationData) {
      updateSIQS(locationData, forecast);
    }
  }, [forecast, locationData, updateSIQS]);
  
  // Update locationData when SIQS changes
  useEffect(() => {
    if (updatedSiqs && locationData) {
      setLocationData(prev => ({
        ...prev,
        siqsResult: updatedSiqs
      }));
    }
  }, [updatedSiqs, locationData, setLocationData]);
  
  // Auto refresh when navigating to this component
  useEffect(() => {
    if (shouldRefresh && locationData) {
      console.log("Auto-refreshing location data due to navigation");
      handleRefresh();
      markRefreshComplete();
    }
  }, [shouldRefresh, locationData, handleRefresh, markRefreshComplete]);
  
  // Format the last update time
  const lastUpdateTimeString = locationData?.weatherData?.timestamp 
    ? `${formatDate(new Date(locationData.weatherData.timestamp), language)} ${formatTime(new Date(locationData.weatherData.timestamp), language)}`
    : null;
  
  // Format weather alerts if present
  const weatherAlertsCount = locationData?.weatherData?.alerts?.length || 0;
  
  // Handle the weather update using forecast data
  const handleWeatherUpdate = useCallback(async () => {
    if (!locationData || !forecast) return;
    
    try {
      setStatusMessage(t("Updating weather conditions...", "正在更新天气条件..."));
      
      // Update the locationData with forecast-based weather
      const updatedData = await updateWeatherWithForecast(locationData, forecast);
      
      if (updatedData) {
        setLocationData(updatedData);
        setStatusMessage(t("Weather updated with forecast data", "已使用预报数据更新天气"));
        
        // Clear status message after 3 seconds
        setTimeout(() => {
          setStatusMessage(null);
        }, 3000);
      } else {
        setStatusMessage(t("No forecast data available", "没有可用的预报数据"));
      }
    } catch (error) {
      console.error("Error updating weather with forecast:", error);
      setStatusMessage(t("Failed to update weather", "更新天气失败"));
    }
  }, [locationData, forecast, updateWeatherWithForecast, setLocationData, setStatusMessage, t]);
  
  // Fetch forecast when locationData changes
  useEffect(() => {
    if (locationData?.latitude && locationData?.longitude) {
      fetchForecast(locationData.latitude, locationData.longitude);
    }
  }, [locationData?.latitude, locationData?.longitude, fetchForecast]);
  
  return (
    <div className="container mx-auto pb-20 md:pb-16 pt-6 md:pt-8 px-4">
      <BackButton destination="/" />
      
      <LocationStatusMessage 
        message={statusMessage}
        type={messageType}
      />
      
      {weatherAlertsCount > 0 && (
        <div className="mb-6">
          <WeatherAlerts alerts={locationData.weatherData.alerts} />
        </div>
      )}
      
      <LocationDetailsHeader 
        locationData={locationData}
        onRefresh={handleRefresh}
        onUpdateWeather={handleWeatherUpdate}
        shouldShowRefreshButton={shouldDisplayRefreshButton(locationData)}
        lastUpdated={lastUpdateTimeString}
      />
      
      <LocationContentGrid 
        locationData={locationData}
        forecast={forecast}
      />
    </div>
  );
};

export default LocationDetailsViewport;
