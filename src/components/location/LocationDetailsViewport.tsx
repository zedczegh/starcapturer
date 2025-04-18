
import React, { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LocationDetailsContent from "./LocationDetailsContent";
import LocationStatusMessage from "./LocationStatusMessage";
import { formatDate, formatTime } from "../forecast/ForecastUtils";
import WeatherAlerts from "../weather/WeatherAlerts";
import { useIsMobile } from "@/hooks/use-mobile";
import LocationDetailsHeader from "./LocationDetailsHeader";
import BackButton from "@/components/navigation/BackButton";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LocationSearch from "./LocationSearch";

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
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
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
  
  return (
    <div 
      className={`container mx-auto px-4 py-8 ${paddingTop} relative z-10`}
      data-refresh-trigger="true"
    >
      <div className="flex justify-between items-center mb-6">
        <BackButton destination="/photo-points" />
        <Button 
          variant="outline" 
          onClick={() => setSearchDialogOpen(true)}
          className="flex items-center gap-1 font-medium"
        >
          <Search className="h-4 w-4" />
          {t("Search", "搜索")}
        </Button>
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
      />
    </div>
  );
};

export default LocationDetailsViewport;
