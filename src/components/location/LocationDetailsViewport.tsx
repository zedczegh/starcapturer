
import React, { useState, useCallback, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LocationDetailsContent from "./LocationDetailsContent";
import LocationStatusMessage from "./LocationStatusMessage";
import { formatDate, formatTime } from "@/components/forecast/ForecastUtils";
import WeatherAlerts from "@/components/weather/WeatherAlerts";
import { useIsMobile } from "@/hooks/use-mobile";
import LocationDetailsHeader from "./LocationDetailsHeader";
import BackButton from "@/components/navigation/BackButton";
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

  // --- Refresh Button Functionality ---
  // Manual refresh by dispatching the same forceRefresh event as initial redirect
  const handleManualRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);

    // Dispatch custom event to trigger refresh in child panels
    setTimeout(() => {
      const dom = detailsContainerRef.current ?? document.querySelector('[data-refresh-trigger]');
      if (dom) {
        dom.dispatchEvent(new CustomEvent('forceRefresh'));
      }
      setTimeout(() => setRefreshing(false), 1200); // Button spinner minimum duration for feedback
    }, 120);
  }, [refreshing]);

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
          <BackButton destination="/photo-points" />
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
