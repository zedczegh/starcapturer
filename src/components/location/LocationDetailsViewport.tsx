
import React, { useState, useEffect, useCallback } from "react";
import { Share, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLongRangeForecast } from "@/hooks/useLongRangeForecast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useForecastDataLoader } from "@/hooks/useForecastDataLoader";
import { toast } from "sonner";
import LocationContentGrid from "./LocationContentGrid";
import LocationControls from "./LocationControls";
import LocationHeader from "./LocationHeader";

interface LocationDetailsViewportProps {
  locationData: any;
  setLocationData: (data: any) => void;
  statusMessage: string | null;
  messageType: "info" | "success" | "error" | "warning";
  setStatusMessage: (message: string | null) => void;
  handleUpdateLocation: (location: {
    name: string;
    latitude: number;
    longitude: number;
  }) => Promise<void>;
}

const LocationDetailsViewport: React.FC<LocationDetailsViewportProps> = ({
  locationData,
  setLocationData,
  statusMessage,
  messageType,
  setStatusMessage,
  handleUpdateLocation,
}) => {
  const { t } = useLanguage();
  const [gettingUserLocation, setGettingUserLocation] = useState(false);
  
  // Load forecast data
  const { loadForecastData, isLoading: forecastLoading } = useForecastDataLoader(
    locationData, 
    setLocationData
  );
  
  // Load long-range forecast data
  const { 
    longRangeForecast, 
    loadLongRangeForecast, 
    isLoading: longRangeLoading 
  } = useLongRangeForecast(locationData);
  
  // Refresh forecast data
  const handleRefreshForecast = useCallback(() => {
    toast.info(t("Refreshing forecast...", "正在刷新天气预报..."));
    loadForecastData(true);
  }, [loadForecastData, t]);
  
  // Refresh long-range forecast data
  const handleRefreshLongRange = useCallback(() => {
    toast.info(t("Refreshing long-range forecast...", "正在刷新长期天气预报..."));
    loadLongRangeForecast(true);
  }, [loadLongRangeForecast, t]);
  
  // Share location
  const handleShareLocation = useCallback(() => {
    if (!locationData) return;
    
    const shareText = `${t("Check out this location for stargazing", "查看这个观星地点")}: ${locationData.name}`;
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: t("Stargazing Location", "观星地点"),
        text: shareText,
        url: shareUrl
      }).catch(error => console.error("Error sharing:", error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
        .then(() => {
          toast.success(t("Link copied to clipboard!", "链接已复制到剪贴板！"));
        })
        .catch(() => {
          toast.error(t("Failed to copy link", "复制链接失败"));
        });
    }
  }, [locationData, t]);
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Status message */}
      {statusMessage && (
        <div className={`mb-4 p-3 rounded-lg ${
          messageType === "error" 
            ? "bg-red-500/20 text-red-200" 
            : messageType === "warning"
            ? "bg-amber-500/20 text-amber-200"
            : messageType === "success"
            ? "bg-green-500/20 text-green-200"
            : "bg-blue-500/20 text-blue-200"
        }`}>
          {statusMessage}
        </div>
      )}
      
      {/* Location header with name and actions */}
      <LocationHeader 
        locationData={locationData}
        onShareLocation={handleShareLocation}
      />
      
      {/* Main content grid */}
      <div className="mt-6">
        <LocationContentGrid
          locationData={locationData}
          forecastData={locationData?.forecastData || {}}
          longRangeForecast={longRangeForecast}
          forecastLoading={forecastLoading}
          longRangeLoading={longRangeLoading}
          gettingUserLocation={gettingUserLocation}
          onLocationUpdate={handleUpdateLocation}
          setGettingUserLocation={setGettingUserLocation}
          setStatusMessage={setStatusMessage}
          onRefreshForecast={handleRefreshForecast}
          onRefreshLongRange={handleRefreshLongRange}
        />
      </div>
      
      {/* Controls for selecting locations */}
      <div className="mt-8">
        <h2 className="text-lg font-medium mb-4">
          {t("Change Location", "更改位置")}
        </h2>
        <LocationControls
          onLocationUpdate={handleUpdateLocation}
          gettingUserLocation={gettingUserLocation}
          setGettingUserLocation={setGettingUserLocation}
          setStatusMessage={setStatusMessage}
          currentLocation={locationData}
        />
      </div>
    </div>
  );
};

export default LocationDetailsViewport;
