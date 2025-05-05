
import React, { useEffect } from "react";
import { useLocationDetails } from "@/hooks/useLocationDetails";
import LocationDetailsViewport from "./LocationDetailsViewport";
import { useRefreshManager } from "@/hooks/location/useRefreshManager";
import { useWeatherSynchronizer } from "@/hooks/locationDetails/useWeatherSynchronizer";
import { toast } from "sonner";

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
  
  // Use the weather synchronizer to ensure data consistency
  const { syncWeatherWithForecast } = useWeatherSynchronizer();
  
  // Forward status messages to parent component
  const handleSetStatusMessage = (message: string | null) => {
    setStatusMessage(message);
    setDetailsStatusMessage(message);
  };

  // Enhanced refresh handler that triggers all data updates
  const handleCompleteRefresh = () => {
    if (!locationData?.latitude || !locationData?.longitude) {
      toast.error("Cannot refresh: Invalid location coordinates");
      return;
    }

    try {
      console.log("Triggering complete refresh of location data");
      // Trigger a full refresh of all data
      handleRefreshAll();
      
      // Mark as complete in the refresh manager
      if (markRefreshComplete) {
        markRefreshComplete();
      }
      
      toast.success("Location data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing location data:", error);
      toast.error("Failed to refresh location data");
    }
  };

  // Sync weather data with forecast when both are available
  useEffect(() => {
    if (forecastData && locationData?.weatherData) {
      const wasSynced = syncWeatherWithForecast(forecastData, locationData, setLocationData);
      if (wasSynced) {
        console.log("Weather data synchronized with forecast");
      }
    }
  }, [forecastData, locationData, setLocationData, syncWeatherWithForecast]);

  // Auto-refresh when the shouldRefresh flag is true
  useEffect(() => {
    if (shouldRefresh && locationData?.latitude && locationData?.longitude) {
      handleCompleteRefresh();
    }
  }, [shouldRefresh, locationData?.latitude, locationData?.longitude]);

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
