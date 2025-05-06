
import React, { useState, useCallback, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LocationDetailsContent from "./LocationDetailsContent";
import LocationStatusMessage from "./LocationStatusMessage";
import { formatDate, formatTime } from "@/components/forecast/ForecastUtils";
import WeatherAlerts from "@/components/weather/WeatherAlerts";
import { useIsMobile } from "@/hooks/use-mobile";
import LocationDetailsHeader from "./LocationDetailsHeader";
import { Search, RefreshCcw, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LocationSearch from "./LocationSearch";
import NavigationButtons from "./navigation/NavigationButtons";
import { motion } from "framer-motion";

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
  
  // Dynamic padding based on mobile status
  const paddingTop = isMobile ? 'pt-20' : 'pt-16';
  const weatherAlerts = locationData?.weatherData?.alerts || [];

  // Improved Refresh Button Functionality
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

  // Animation variants for UI elements
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className={`container mx-auto px-3 sm:px-4 py-4 sm:py-6 ${paddingTop} relative z-10 max-w-5xl`}
      data-refresh-trigger="true"
      ref={detailsContainerRef}
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
      }}
    >
      <motion.div 
        variants={fadeInUp}
        className="flex justify-between items-center mb-4 gap-2"
      >
        <div className="flex items-center gap-2">
          {locationData?.latitude && locationData?.longitude && (
            <NavigationButtons 
              latitude={locationData.latitude}
              longitude={locationData.longitude}
              locationName={locationData?.name || ""}
            />
          )}
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"}
            className="flex items-center gap-1 font-medium bg-cosmic-800/40 border-cosmic-700/40 hover:bg-cosmic-700/60"
            onClick={handleManualRefresh}
            disabled={refreshing}
            title={t("Refresh", "刷新")}
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin text-primary' : 'text-cosmic-300'}`} />
            <span className="hidden sm:inline">{t("Refresh", "刷新")}</span>
          </Button>
          <Button 
            variant="outline"
            size={isMobile ? "sm" : "default"} 
            onClick={() => setSearchDialogOpen(true)}
            className="flex items-center gap-1 font-medium bg-cosmic-800/40 border-cosmic-700/40 hover:bg-cosmic-700/60"
          >
            <Search className="h-4 w-4 text-cosmic-300" />
            <span className="hidden sm:inline">{t("Search", "搜索")}</span>
          </Button>
        </div>
      </motion.div>
      
      {/* Search Dialog */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="sm:max-w-md glassmorphism-strong border-cosmic-700/40">
          <LocationSearch onSelectLocation={onLocationUpdate} />
        </DialogContent>
      </Dialog>
      
      <LocationStatusMessage 
        message={statusMessage}
        type={messageType}
      />
      
      {/* Add the enhanced location details header */}
      <motion.div variants={fadeInUp}>
        <LocationDetailsHeader 
          name={locationData?.name}
          latitude={locationData?.latitude}
          longitude={locationData?.longitude}
          timestamp={locationData?.timestamp}
        />
      </motion.div>
      
      {weatherAlerts && weatherAlerts.length > 0 && (
        <motion.div variants={fadeInUp} className="mb-4">
          <WeatherAlerts 
            alerts={weatherAlerts}
            formatTime={formatTime}
            formatDate={formatDate}
          />
        </motion.div>
      )}
      
      <motion.div variants={fadeInUp}>
        <LocationDetailsContent 
          locationData={locationData}
          setLocationData={setLocationData}
          onLocationUpdate={onLocationUpdate}
          showFaultedMessage={true}
        />
      </motion.div>
    </motion.div>
  );
};

export default LocationDetailsViewport;
