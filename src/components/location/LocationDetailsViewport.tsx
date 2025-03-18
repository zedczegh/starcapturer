
import React, { useState, useCallback, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LocationDetailsHeader from "./LocationDetailsHeader";
import LocationContentGrid from "./LocationContentGrid";
import LocationStatusMessage from "./LocationStatusMessage";
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

  const handleRefresh = useCallback(async () => {
    await handleRefreshAll(
      locationData, 
      setLocationData, 
      () => {
        handleRefreshForecast(locationData.latitude, locationData.longitude);
        handleRefreshLongRangeForecast(locationData.latitude, locationData.longitude);
      },
      setStatusMessage
    );
  }, [locationData, setLocationData, handleRefreshAll, handleRefreshForecast, handleRefreshLongRangeForecast, setStatusMessage]);

  return (
    <div className="min-h-screen bg-cosmic-950">
      {/* Add top padding to create space for the navbar */}
      <div className="pt-24 md:pt-28">
        <div className="container mx-auto px-4 text-center mb-8">
          <LocationDetailsHeader 
            name={locationData?.name}
            timestamp={locationData?.timestamp}
            onRefresh={handleRefresh}
            loading={loading}
            className="mx-auto"
          />
        </div>
        
        <LocationStatusMessage 
          message={statusMessage} 
          type={messageType} 
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
            onLocationUpdate={handleUpdateLocation}
            setGettingUserLocation={setGettingUserLocation}
            setStatusMessage={setStatusMessage}
            onRefreshForecast={() => handleRefreshForecast(locationData.latitude, locationData.longitude)}
            onRefreshLongRange={() => handleRefreshLongRangeForecast(locationData.latitude, locationData.longitude)}
          />
        </div>
      </div>
    </div>
  );
};

export default LocationDetailsViewport;
