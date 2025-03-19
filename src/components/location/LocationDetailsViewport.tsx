
import React, { useState, useCallback, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LocationDetailsHeader from "./LocationDetailsHeader";
import LocationContentGrid from "./LocationContentGrid";
import LocationStatusMessage from "./LocationStatusMessage";
import { useWeatherUpdater } from "@/hooks/useWeatherUpdater";
import { useForecastManager } from "@/hooks/locationDetails/useForecastManager";
import { formatDate, formatTime } from "@/components/forecast/ForecastUtils";
import WeatherAlerts from "@/components/weather/WeatherAlerts";
import BackButton from "@/components/navigation/BackButton";

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

  // Auto-refresh data only once when the component mounts
  useEffect(() => {
    let isMounted = true;
    const refreshData = async () => {
      if (!isMounted) return;
      
      const lastUpdate = new Date(locationData.timestamp).getTime();
      const now = new Date().getTime();
      const minutesSinceLastUpdate = (now - lastUpdate) / (1000 * 60);
      
      // Refresh if data is older than 30 minutes
      if (minutesSinceLastUpdate > 30 && !loading) {
        handleRefreshAll(
          locationData,
          setLocationData,
          () => {
            if (isMounted) {
              handleRefreshForecast(locationData.latitude, locationData.longitude);
              handleRefreshLongRangeForecast(locationData.latitude, locationData.longitude);
            }
          },
          setStatusMessage
        );
      }
    };
    
    if (locationData) {
      // Add a slight delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        refreshData();
      }, 1000);
      
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
    
    return () => {
      isMounted = false;
    };
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
    <div className="min-h-screen bg-cosmic-950 animate-fade-in">
      {/* The navbar is part of the App.tsx and is rendered automatically for all routes */}
      
      {/* Add top padding to create space for the navbar */}
      <div className="pt-24 md:pt-28">
        {/* Back button positioned in the top-left corner */}
        <div className="fixed top-24 left-4 md:top-28 md:left-8 z-50">
          <BackButton 
            destination="/"
            replace={true}
            variant="secondary"
            size="sm"
            className="hover:bg-primary/20 transition-colors duration-300"
          />
        </div>
        
        <div className="container mx-auto px-4 mt-4 mb-6">
          <div className="text-center my-8 pt-6">
            <LocationDetailsHeader 
              name={locationData?.name}
              timestamp={locationData?.timestamp}
              onRefresh={handleRefresh}
              loading={loading}
              className="mx-auto transition-all hover:scale-[1.01] duration-300"
            />
          </div>
        </div>
        
        <LocationStatusMessage 
          message={statusMessage} 
          type={messageType} 
        />
        
        {weatherAlerts && weatherAlerts.length > 0 && (
          <div className="container mx-auto px-4 mb-6 animate-fade-in">
            <WeatherAlerts 
              alerts={weatherAlerts}
              formatTime={formatTime}
              formatDate={formatDate}
            />
          </div>
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
