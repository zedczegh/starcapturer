
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LocationDetailsContent from "./LocationDetailsContent";
import LocationStatusMessage from "./LocationStatusMessage";
import { formatDate, formatTime } from "@/components/forecast/ForecastUtils";
import WeatherAlerts from "@/components/weather/WeatherAlerts";
import { useIsMobile } from "@/hooks/use-mobile";
import LocationDetailsHeader from "./LocationDetailsHeader";
import { Search, RefreshCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LocationSearch from "./LocationSearch";
import NavigationButtons from "./navigation/NavigationButtons";
import CountryFlag from "./CountryFlag";
import BortleNowTab from "./BortleNowTab";

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
  const [activeTab, setActiveTab] = useState<string>("details");
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

  // --- Improved Refresh Button Functionality ---
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
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Navigation app picker button */}
          {locationData?.latitude && locationData?.longitude && (
            <>
              <NavigationButtons 
                latitude={locationData.latitude}
                longitude={locationData.longitude}
                locationName={locationData?.name || ""}
              />
              <CountryFlag 
                latitude={locationData.latitude}
                longitude={locationData.longitude}
                showName={true}
                className="text-lg"
              />
            </>
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
            <span className={isMobile ? "sr-only" : ""}>
              {t("Refresh", "刷新")}
            </span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setSearchDialogOpen(true)}
            className="flex items-center gap-1 font-medium"
          >
            <Search className="h-4 w-4" />
            <span className={isMobile ? "sr-only" : ""}>
              {t("Search", "搜索")}
            </span>
          </Button>
        </div>
      </div>
      
      {/* Search Dialog */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <LocationSearch onSelectLocation={onLocationUpdate} />
        </DialogContent>
      </Dialog>
      
      {statusMessage && (
        <LocationStatusMessage 
          message={statusMessage}
          type={messageType}
        />
      )}
      
      {errorState && (
        <div className="mb-4 rounded-md border border-red-800/40 bg-red-900/20 p-3 text-sm">
          <div className="flex items-center">
            <AlertTriangle className="mr-2 h-4 w-4 text-red-400" />
            <span className="text-red-200">{errorState}</span>
          </div>
        </div>
      )}
      
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
      
      {/* Tabs for Details and Bortle Now */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
        <div className="flex justify-center mb-6">
          <TabsList className="bg-background/50 backdrop-blur-sm border border-border/50">
            <TabsTrigger value="details" className="data-[state=active]:bg-primary/20">
              {t("Details", "详情")}
            </TabsTrigger>
            <TabsTrigger value="bortle-now" className="data-[state=active]:bg-primary/20">
              {t("Bortle Now", "实时光污染")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="details">
          {/* Use the key to force remount when location changes */}
          <div key={contentKey} className="content-wrapper">
            <LocationDetailsContent 
              locationData={locationData}
              setLocationData={setLocationData}
              onLocationUpdate={onLocationUpdate}
              showFaultedMessage={true}
            />
          </div>
        </TabsContent>

        <TabsContent value="bortle-now">
          <BortleNowTab
            initialLatitude={locationData?.latitude}
            initialLongitude={locationData?.longitude}
            locationName={locationData?.name}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LocationDetailsViewport;
