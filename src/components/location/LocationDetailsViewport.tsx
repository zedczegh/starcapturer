
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LocationDetailsContent from "./LocationDetailsContent";
import LocationStatusMessage from "./LocationStatusMessage";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LocationSearch from "./LocationSearch";
import LocationDetailsHeader from "./LocationDetailsHeader";
import NavigationSection from "./viewport/NavigationSection";
import ErrorDisplay from "./viewport/ErrorDisplay";
import WeatherAlertsSection from "./viewport/WeatherAlertsSection";
import { useIsMobile } from "@/hooks/use-mobile";

interface LocationDetailsViewportProps {
  locationData: any;
  setLocationData: React.Dispatch<React.SetStateAction<any>>;
  statusMessage: string | null;
  messageType: "info" | "error" | "success" | null;
  setStatusMessage: React.Dispatch<React.SetStateAction<string | null>>;
  handleUpdateLocation: (updatedData: any) => Promise<void>;
  onRefresh?: () => void;
}

const LocationDetailsViewport: React.FC<LocationDetailsViewportProps> = ({
  locationData,
  setLocationData,
  statusMessage,
  messageType,
  setStatusMessage,
  handleUpdateLocation,
  onRefresh
}) => {
  const [gettingUserLocation, setGettingUserLocation] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const detailsContainerRef = useRef<HTMLDivElement>(null);
  const refreshAttempts = useRef(0);
  const [contentKey, setContentKey] = useState<number>(1);
  const locationIdRef = useRef<string | null>(null);
  const statusMessageTimeoutRef = useRef<number | null>(null);

  // Check if we came from a redirect
  const isRedirect = locationData?.fromPhotoPoints || locationData?.fromCalculator;

  // Track location ID changes to prevent content disappearing 
  useEffect(() => {
    if (locationData?.id && locationIdRef.current !== locationData.id) {
      locationIdRef.current = locationData.id;
      // Increment the key to force a fresh render when location changes
      setContentKey(prev => prev + 1);
    }
  }, [locationData?.id]);
  
  // Clear error state when location data changes
  useEffect(() => {
    if (locationData?.id) {
      setErrorState(null);
      refreshAttempts.current = 0;
    }
  }, [locationData?.id]);

  // Clear loading status message after data is loaded
  useEffect(() => {
    if (statusMessage && locationData && 
       (statusMessage.includes("Getting your current location") || 
        statusMessage.includes("正在获取您的位置"))) {
      if (statusMessageTimeoutRef.current) {
        clearTimeout(statusMessageTimeoutRef.current);
      }
      statusMessageTimeoutRef.current = window.setTimeout(() => {
        setStatusMessage(null);
      }, 1000);
    }
    
    return () => {
      if (statusMessageTimeoutRef.current) {
        clearTimeout(statusMessageTimeoutRef.current);
      }
    };
  }, [statusMessage, locationData, setStatusMessage]);

  // Function to handle the location update
  const onLocationUpdate = useCallback(async (location: any) => {
    try {
      await handleUpdateLocation({
        ...location,
        timestamp: new Date().toISOString()
      });

      setStatusMessage(t("Location updated successfully", "位置更新成功"));
      setSearchDialogOpen(false);
    } catch (error) {
      console.error("Error updating location:", error);
      setStatusMessage(t("Failed to update location", "更新位置失败"));
      setErrorState(t("Location update failed", "位置更新失败"));
    }
  }, [handleUpdateLocation, setStatusMessage, t]);
  
  const paddingTop = isMobile ? 'pt-16' : 'pt-14';
  const weatherAlerts = locationData?.weatherData?.alerts || [];

  // Manual refresh that triggers actual data refresh
  const handleManualRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    refreshAttempts.current += 1;
    
    // Set status message to inform user
    setStatusMessage(t("Refreshing data...", "正在刷新数据..."));

    try {
      // First, trigger the onRefresh prop if provided
      if (onRefresh) {
        onRefresh();
      }

      // Also dispatch custom event to trigger refresh in child panels
      setTimeout(() => {
        const dom = detailsContainerRef.current ?? document.querySelector('[data-refresh-trigger]');
        if (dom) {
          dom.dispatchEvent(new CustomEvent('forceRefresh', {
            detail: { 
              timestamp: new Date().toISOString(),
              attempt: refreshAttempts.current
            }
          }));
          console.log("Force refresh event dispatched with timestamp");
        }
        
        // Add minimum duration for button spinner feedback
        setTimeout(() => {
          setRefreshing(false);
          setStatusMessage(t("Data refreshed", "数据已刷新"));
          
          // Clear status message after a delay
          setTimeout(() => setStatusMessage(null), 3000);
        }, 1200);
      }, 120);
    } catch (error) {
      console.error("Error during refresh:", error);
      setRefreshing(false);
      setErrorState(t("Refresh failed. Please try again.", "刷新失败。请重试。"));
      setStatusMessage(t("Refresh failed. Please try again.", "刷新失败。请重试。"));
    }
  }, [refreshing, onRefresh, setStatusMessage, t]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (statusMessageTimeoutRef.current) {
        clearTimeout(statusMessageTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className={`container relative z-10 mx-auto px-4 py-8 ${paddingTop}`}
      data-refresh-trigger="true"
      ref={detailsContainerRef}
    >
      {/* Navigation Section */}
      <NavigationSection
        locationData={locationData}
        onOpenSearch={() => setSearchDialogOpen(true)}
        onRefresh={handleManualRefresh}
        refreshing={refreshing}
      />
      
      {/* Search Dialog */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <LocationSearch onSelectLocation={onLocationUpdate} />
        </DialogContent>
      </Dialog>
      
      {/* Status Message */}
      {statusMessage && (
        <LocationStatusMessage 
          message={statusMessage}
          type={messageType}
        />
      )}
      
      {/* Error Display */}
      <ErrorDisplay errorMessage={errorState} />
      
      {/* Location Header */}
      <LocationDetailsHeader 
        name={locationData?.name}
        latitude={locationData?.latitude}
        longitude={locationData?.longitude}
        timestamp={locationData?.timestamp}
      />
      
      {/* Weather Alerts */}
      <WeatherAlertsSection alerts={weatherAlerts} />
      
      {/* Main Content */}
      <div key={contentKey} className="content-wrapper">
        <LocationDetailsContent 
          locationData={locationData}
          setLocationData={setLocationData}
          onLocationUpdate={onLocationUpdate}
          showFaultedMessage={true}
        />
      </div>
    </div>
  );
};

export default LocationDetailsViewport;
