
import React, { useState, useCallback, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LocationDetailsContent from "./LocationDetailsContent";
import LocationStatusMessage from "./LocationStatusMessage";
import { formatDate, formatTime } from "@/components/forecast/ForecastUtils";
import WeatherAlerts from "@/components/weather/WeatherAlerts";
import { useIsMobile } from "@/hooks/use-mobile";
import LocationDetailsHeader from "./LocationDetailsHeader";
import { Search, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LocationSearch from "./LocationSearch";
import NavigationButtons from "./navigation/NavigationButtons";

interface LocationDetailsViewportProps {
  locationData: any;
  setLocationData: React.Dispatch<React.SetStateAction<any>>;
  statusMessage: string | null;
  messageType: "info" | "error" | "success" | null;
  setStatusMessage: React.Dispatch<React.SetStateAction<string | null>>;
  handleUpdateLocation: (updatedData: any) => Promise<void>;
  onRefresh?: () => void; // Add this prop for refresh handling
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
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const detailsContainerRef = useRef<HTMLDivElement>(null);

  // Check if we came from a redirect
  const isRedirect = locationData?.fromPhotoPoints || locationData?.fromCalculator;

  // Function to handle the location update
  const onLocationUpdate = useCallback(async (location: any) => {
    try {
      await handleUpdateLocation({
        ...location,
        timestamp: new Date().toISOString()
      });

      setStatusMessage(t ? t("Location updated successfully", "位置更新成功") : "Location updated successfully");

      // Close the search dialog after selection
      setSearchDialogOpen(false);
    } catch (error) {
      console.error("Error updating location:", error);
      setStatusMessage(t ? t("Failed to update location", "更新位置失败") : "Failed to update location");
    }
  }, [handleUpdateLocation, setStatusMessage, t]);
  
  const paddingTop = isMobile ? 'pt-16' : 'pt-14';
  const weatherAlerts = locationData?.weatherData?.alerts || [];

  // --- Improved Refresh Button Functionality ---
  // Manual refresh that triggers actual data refresh
  const handleManualRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    
    // Set status message to inform user
    setStatusMessage(t ? t("Refreshing data...", "正在刷新数据...") : "Refreshing data...");

    // First, trigger the onRefresh prop if provided
    if (onRefresh) {
      onRefresh();
    }

    // Also dispatch custom event to trigger refresh in child panels
    setTimeout(() => {
      const dom = detailsContainerRef.current ?? document.querySelector('[data-refresh-trigger]');
      if (dom) {
        dom.dispatchEvent(new CustomEvent('forceRefresh', {
          detail: { timestamp: new Date().toISOString() }
        }));
        console.log("Force refresh event dispatched with timestamp");
      }
      
      // Add minimum duration for button spinner feedback
      setTimeout(() => {
        setRefreshing(false);
        setStatusMessage(t ? t("Data refreshed", "数据已刷新") : "Data refreshed");
        
        // Clear status message after a delay
        setTimeout(() => setStatusMessage(null), 3000);
      }, 1200);
    }, 120);
  }, [refreshing, onRefresh, setStatusMessage, t]);

  return (
    <div 
      className={`container mx-auto px-4 py-8 ${paddingTop} relative z-10`}
      data-refresh-trigger="true"
      ref={detailsContainerRef}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          {/* Navigation app picker button */}
          {locationData?.latitude && locationData?.longitude && (
            <NavigationButtons 
              latitude={locationData.latitude}
              longitude={locationData.longitude}
              locationName={locationData?.name || ""}
            />
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-1 font-medium"
            onClick={handleManualRefresh}
            disabled={refreshing}
            title={t("Refresh", "刷新")}
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {t("Refresh", "刷新")}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setSearchDialogOpen(true)}
            className="flex items-center gap-1 font-medium"
          >
            <Search className="h-4 w-4" />
            {t("Search", "搜索")}
          </Button>
        </div>
      </div>
      
      {/* Search Dialog */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <LocationSearch onSelectLocation={onLocationUpdate} />
        </DialogContent>
      </Dialog>
      
      <LocationStatusMessage 
        message={statusMessage}
        type={messageType}
      />
      
      {/* Add the enhanced location details header */}
      <LocationDetailsHeader 
        name={locationData?.name}
        latitude={locationData?.latitude}
        longitude={locationData?.longitude}
        timestamp={locationData?.timestamp}
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
        showFaultedMessage={true}
      />
    </div>
  );
};

export default LocationDetailsViewport;
