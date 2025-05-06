
import React from "react";
import { useLocationDetails } from "@/hooks/useLocationDetails";
import LocationDetailsViewport from "./LocationDetailsViewport";
import { useRefreshManager } from "@/hooks/location/useRefreshManager";
import { useWeatherAutoRefresh } from "@/hooks/location/useWeatherAutoRefresh"; 

interface LocationDetailsMainProps {
  locationData: any;
  setLocationData: (data: any) => void;
  statusMessage: string | null;
  messageType: "info" | "error" | "success" | null;
  setStatusMessage: React.Dispatch<React.SetStateAction<string | null>>;
  handleUpdateLocation: (updatedData: any) => Promise<void>;
}

const LocationDetailsMain: React.FC<LocationDetailsMainProps> = ({
  locationData,
  setLocationData,
  statusMessage,
  messageType,
  setStatusMessage,
  handleUpdateLocation
}) => {
  // Use the location details hook to handle data fetching and state
  const {
    forecastData,
    longRangeForecast,
    loading,
    forecastLoading,
    longRangeLoading,
    gettingUserLocation,
    setStatusMessage: setDetailsStatusMessage,
    setGettingUserLocation,
    handleRefreshAll,
    handleRefreshForecast,
    handleRefreshLongRangeForecast,
    weatherAlerts
  } = useLocationDetails(locationData, setLocationData);
  
  // Use the refresh manager to control refresh logic
  const { shouldRefresh, markRefreshComplete, refreshCount } = useRefreshManager(locationData);
  
  // Forward status messages to parent component
  const handleSetStatusMessage = (message: string | null) => {
    setStatusMessage(message);
    setDetailsStatusMessage(message);
  };

  // Enhanced refresh handler that triggers all data updates
  const handleCompleteRefresh = () => {
    console.log("Triggering complete refresh of location data");
    if (locationData?.latitude && locationData?.longitude) {
      // Trigger a full refresh of all data
      handleRefreshAll();
      
      // Mark as complete in the refresh manager
      if (markRefreshComplete) {
        markRefreshComplete();
      }
    }
  };

  // Auto-refresh weather data if invalid
  useWeatherAutoRefresh({
    weatherData: locationData?.weatherData,
    refreshFn: handleCompleteRefresh,
    maxRetries: 3,
    retryDelay: 3000
  });

  // Set additional props for location data
  const enhancedLocationData = {
    ...locationData,
    forecastData,
    longRangeForecast,
    weatherAlerts,
    refreshCount
  };

  return (
    <LocationDetailsViewport
      locationData={enhancedLocationData}
      setLocationData={setLocationData}
      statusMessage={statusMessage}
      messageType={messageType}
      setStatusMessage={handleSetStatusMessage}
      handleUpdateLocation={handleUpdateLocation}
      onRefresh={handleCompleteRefresh}
    />
  );
};

export default LocationDetailsMain;
