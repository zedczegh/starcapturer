
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LocationDetailsContent from "./LocationDetailsContent";
import LocationStatusMessage from "./LocationStatusMessage";
import { useWeatherUpdater } from "@/hooks/useWeatherUpdater";
import { useForecastManager } from "@/hooks/locationDetails/useForecastManager";
import { formatDate, formatTime } from "@/components/forecast/ForecastUtils";
import WeatherAlerts from "@/components/weather/WeatherAlerts";
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
  const { loading, handleRefreshAll } = useWeatherUpdater();
  const containerRef = useRef<HTMLDivElement>(null);
  const initialRefreshDoneRef = useRef(false);
  const refreshTriggerRef = useRef(false);
  
  // Check if we came from a redirect
  const isRedirect = locationData?.fromPhotoPoints || locationData?.fromCalculator;
  
  const {
    forecastData,
    longRangeForecast,
    forecastLoading,
    longRangeLoading,
    weatherAlerts,
    handleRefreshForecast,
    handleRefreshLongRangeForecast
  } = useForecastManager(locationData);

  // Use the refresh manager hook for controlled refreshes
  const { shouldRefresh, markRefreshComplete } = useRefreshManager(locationData);
  
  // Use the dedicated SIQS updater
  const { resetUpdateState, updateSIQSForLocation } = useLocationSIQSUpdater(
    locationData,
    forecastData,
    setLocationData,
    t
  );

  // Reset SIQS update state when location changes
  useEffect(() => {
    if (locationData?.latitude && locationData?.longitude) {
      resetUpdateState();
    }
  }, [locationData?.latitude, locationData?.longitude, resetUpdateState]);
  
  // Function to handle the location update
  const onLocationUpdate = useCallback(async (location: any) => {
    try {
      await handleUpdateLocation({
        ...location,
        timestamp: new Date().toISOString()
      });
      
      // Reset SIQS update state when location changes
      resetUpdateState();
      setStatusMessage(t ? t("Location updated successfully", "位置更新成功") : "Location updated successfully");
    } catch (error) {
      console.error("Error updating location:", error);
      setStatusMessage(t ? t("Failed to update location", "更新位置失败") : "Failed to update location");
    }
  }, [handleUpdateLocation, resetUpdateState, setStatusMessage, t]);
  
  // Auto refresh on initial render - with debounce protection and redirect awareness
  useEffect(() => {
    // Skip auto-refresh if we're coming from a redirect and data is already present
    if (isRedirect && locationData?.weatherData && locationData?.siqsResult) {
      console.log("Skipping auto-refresh due to redirect with existing data");
      initialRefreshDoneRef.current = true;
      return;
    }
    
    if (locationData && !initialRefreshDoneRef.current && !refreshTriggerRef.current) {
      refreshTriggerRef.current = true;
      initialRefreshDoneRef.current = true;
      
      const timer = setTimeout(() => {
        handleRefreshAll(locationData, setLocationData, () => {
          if (locationData.latitude && locationData.longitude) {
            handleRefreshForecast(locationData.latitude, locationData.longitude);
            handleRefreshLongRangeForecast(locationData.latitude, locationData.longitude);
          }
          refreshTriggerRef.current = false;
        }, setStatusMessage);
      }, 800); // Increased delay to prevent flashing
      
      return () => {
        clearTimeout(timer);
        refreshTriggerRef.current = false;
      };
    }
  }, [locationData, handleRefreshAll, handleRefreshForecast, handleRefreshLongRangeForecast, setLocationData, setStatusMessage, isRedirect]);
  
  // Handle refresh events from external components
  useEffect(() => {
    const handleForceRefresh = () => {
      if (refreshTriggerRef.current) return; // Prevent multiple simultaneous refreshes
      
      console.log("Force refresh event received");
      refreshTriggerRef.current = true;
      handleRefreshAll(locationData, setLocationData, () => {
        if (locationData.latitude && locationData.longitude) {
          handleRefreshForecast(locationData.latitude, locationData.longitude);
          handleRefreshLongRangeForecast(locationData.latitude, locationData.longitude);
        }
        refreshTriggerRef.current = false;
      }, setStatusMessage);
    };
    
    if (containerRef.current) {
      containerRef.current.addEventListener('forceRefresh', handleForceRefresh);
    }
    
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('forceRefresh', handleForceRefresh);
      }
    };
  }, [handleRefreshAll, handleRefreshForecast, handleRefreshLongRangeForecast, locationData, setLocationData, setStatusMessage]);
  
  return (
    <div 
      className="container mx-auto px-4 py-8 pt-14 relative z-10" /* Added pt-14 to fix navbar overlap */
      ref={containerRef}
      data-refresh-trigger="true"
    >
      <LocationStatusMessage 
        message={statusMessage}
        type={messageType}
      />
      
      {weatherAlerts && weatherAlerts.length > 0 && (
        <div className="mb-8">
          <WeatherAlerts 
            alerts={weatherAlerts}
            formatTime={formatTime}
            formatDate={formatDate}
          />
        </div>
      )}
      
      <LocationDetailsContent 
        locationData={locationData}
        setLocationData={setLocationData}
        onLocationUpdate={onLocationUpdate}
      />
    </div>
  );
};

export default LocationDetailsViewport;
