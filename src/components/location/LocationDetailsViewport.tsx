
import React, { useState, useCallback, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LocationDetailsHeader from "./LocationDetailsHeader";
import LocationContentGrid from "./LocationContentGrid";
import LocationStatusMessage from "./LocationStatusMessage";
import { handleLocationChange } from "@/hooks/location/useLocationInit";
import { useWeatherUpdater } from "@/hooks/useWeatherUpdater";
import { useForecastManager } from "@/hooks/locationDetails/useForecastManager";
import { formatDate, formatTime } from "@/components/forecast/ForecastUtils";
import WeatherAlerts from "@/components/weather/WeatherAlerts";

interface LocationDetailsViewportProps {
  locationData: any;
  setLocationData: React.Dispatch<React.SetStateAction<any>>;
  statusMessage: string | null;
  messageType: "info" | "error" | "success" | null;
  setStatusMessage: React.Dispatch<React.SetStateAction<string | null>>;
  handleUpdateLocation: (updatedData: any) => void;
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
  const { loading, handleRefreshAll } = useWeatherUpdater();
  
  const {
    forecastData,
    longRangeForecast,
    forecastLoading,
    longRangeLoading,
    weatherAlerts,
    handleRefreshForecast,
    handleRefreshLongRangeForecast
  } = useForecastManager(locationData);

  // Auto-refresh data when the component mounts
  useEffect(() => {
    const refreshData = async () => {
      const lastUpdate = new Date(locationData.timestamp).getTime();
      const now = new Date().getTime();
      const minutesSinceLastUpdate = (now - lastUpdate) / (1000 * 60);
      
      // Refresh if data is older than 30 minutes
      if (minutesSinceLastUpdate > 30) {
        handleRefreshAll(
          locationData,
          setLocationData,
          () => {
            handleRefreshForecast(locationData.latitude, locationData.longitude);
            handleRefreshLongRangeForecast(locationData.latitude, locationData.longitude);
          },
          setStatusMessage
        );
      }
    };
    
    if (locationData && !loading) {
      refreshData();
    }
  }, []);

  const handleLocationUpdate = useCallback(async (location: { name: string; latitude: number; longitude: number }) => {
    setGettingUserLocation(true);
    setStatusMessage(t("Getting new location...", "获取新位置中..."));

    try {
      const updatedLocation = await handleLocationChange(
        location.latitude,
        location.longitude,
        location.name,
        language
      );

      if (updatedLocation) {
        handleUpdateLocation(updatedLocation);
        setStatusMessage(t("Location updated", "位置已更新"));
        
        // Refresh forecast data for the new location
        handleRefreshForecast(location.latitude, location.longitude);
        handleRefreshLongRangeForecast(location.latitude, location.longitude);
        
        // Clear status message after 3 seconds
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (error) {
      console.error("Error updating location:", error);
      setStatusMessage(t("Error updating location", "更新位置时出错"));
    } finally {
      setGettingUserLocation(false);
    }
  }, [setStatusMessage, t, handleUpdateLocation, language, handleRefreshForecast, handleRefreshLongRangeForecast]);

  return (
    <div className="min-h-screen bg-cosmic-950">
      <LocationDetailsHeader 
        locationData={locationData} 
        onRefresh={() => 
          handleRefreshAll(
            locationData, 
            setLocationData, 
            () => {
              handleRefreshForecast(locationData.latitude, locationData.longitude);
              handleRefreshLongRangeForecast(locationData.latitude, locationData.longitude);
            },
            setStatusMessage
          )
        } 
        refreshing={loading}
      />
      
      <LocationStatusMessage 
        message={statusMessage} 
        messageType={messageType} 
      />
      
      {weatherAlerts && weatherAlerts.length > 0 && (
        <WeatherAlerts 
          alerts={weatherAlerts}
          formatTime={formatTime}
          formatDate={formatDate}
        />
      )}
      
      <div className="container mx-auto px-4 pb-24 pt-4">
        <LocationContentGrid
          locationData={locationData}
          forecastData={forecastData}
          longRangeForecast={longRangeForecast}
          forecastLoading={forecastLoading}
          longRangeLoading={longRangeLoading}
          gettingUserLocation={gettingUserLocation}
          onLocationUpdate={handleLocationUpdate}
          setGettingUserLocation={setGettingUserLocation}
          setStatusMessage={setStatusMessage}
          onRefreshForecast={() => handleRefreshForecast(locationData.latitude, locationData.longitude)}
          onRefreshLongRange={() => handleRefreshLongRangeForecast(locationData.latitude, locationData.longitude)}
        />
      </div>
    </div>
  );
};

export default LocationDetailsViewport;
