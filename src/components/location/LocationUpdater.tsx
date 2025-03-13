
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Locate } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LocationMap from "@/components/LocationMap";
import MapSelector, { Location } from "@/components/MapSelector";
import { useToast } from "@/hooks/use-toast";
import { useLocationDataCache } from "@/hooks/location/useLocationCache";
import { findClosestKnownLocation } from "@/utils/bortleScaleEstimation";

interface LocationUpdaterProps {
  locationData: any;
  onLocationUpdate: (location: { name: string; latitude: number; longitude: number }) => Promise<void>;
  gettingUserLocation: boolean;
  setGettingUserLocation: (state: boolean) => void;
  setStatusMessage: (message: string | null) => void;
}

const LocationUpdater: React.FC<LocationUpdaterProps> = ({
  locationData,
  onLocationUpdate,
  gettingUserLocation,
  setGettingUserLocation,
  setStatusMessage
}) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [mapError, setMapError] = useState<string | null>(null);
  const { getLocationName } = useLocationDataCache();

  const handleLocationSearch = (selectedLocation: Location) => {
    try {
      // Get a good location name
      let locationName = selectedLocation.name;
      
      // If name is missing or looks like coordinates, try to get a better name
      if (!locationName || locationName.includes("Location at")) {
        const betterName = getLocationName(selectedLocation.latitude, selectedLocation.longitude);
        if (betterName && !betterName.includes("Location at")) {
          locationName = betterName;
        }
      }
      
      onLocationUpdate({
        name: locationName,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude
      });
      
      setStatusMessage(t(`Now viewing ${locationName}`, `现在查看 ${locationName}`));
    } catch (error) {
      console.error("Error updating location:", error);
      setStatusMessage(t("Failed to update location", "无法更新位置"));
      toast({
        title: t("Error", "错误"),
        description: t("Failed to update location", "无法更新位置"),
        variant: "destructive"
      });
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatusMessage(t("Geolocation is not supported by your browser.", "您的浏览器不支持地理定位。"));
      return;
    }

    setGettingUserLocation(true);
    setStatusMessage(t("Accessing your current location...", "正在访问您的当前位置..."));

    const locationTimeout = setTimeout(() => {
      if (gettingUserLocation) {
        setGettingUserLocation(false);
        setStatusMessage(t("Could not get your location in time. Please try again.", "无法及时获取您的位置。请重试。"));
      }
    }, 15000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(locationTimeout);
        try {
          const { latitude, longitude } = position.coords;
          
          // Try to get a proper location name from our database
          const closestLocation = findClosestKnownLocation(latitude, longitude);
          let locationName = `Location at ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
          
          if (closestLocation.distance <= 20) {
            locationName = closestLocation.name;
          }
          
          await onLocationUpdate({
            name: locationName,
            latitude,
            longitude
          });
          
          setStatusMessage(t("Using your current location.", "使用您的当前位置。"));
          
          setTimeout(() => setStatusMessage(null), 3000);
        } catch (error) {
          console.error("Error getting current location:", error);
          setStatusMessage(t("Failed to get your current location.", "无法获取您的当前位置。"));
        } finally {
          setGettingUserLocation(false);
        }
      },
      (error) => {
        clearTimeout(locationTimeout);
        console.error("Geolocation error:", error);
        let errorMessage = t("Unknown error occurred.", "发生了未知错误。");
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t("You denied the request for geolocation. Please check your browser settings and try again.", "您拒绝了地理定位请求。请检查浏览器设置并重试。");
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = t("Location information is unavailable. Please try again later.", "位置信息不可用。请稍后再试。");
            break;
          case error.TIMEOUT:
            errorMessage = t("The request to get location timed out. Please try again.", "获取位置请求超时。请重试。");
            break;
        }
        
        setStatusMessage(errorMessage);
        setGettingUserLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Safely check if locationData has required properties
  const hasValidCoordinates = locationData && 
    typeof locationData.latitude === 'number' && isFinite(locationData.latitude) && 
    typeof locationData.longitude === 'number' && isFinite(locationData.longitude);

  // Default coordinates to use if locationData is invalid
  const fallbackLatitude = 0;
  const fallbackLongitude = 0;
  const fallbackName = t("Unnamed Location", "未命名位置");

  return (
    <Card className="shadow-md overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center">
          <MapPin className="mr-2 h-5 w-5 text-primary/80" />
          {t("Location", "位置")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <LocationMap
          latitude={hasValidCoordinates ? locationData.latitude : fallbackLatitude}
          longitude={hasValidCoordinates ? locationData.longitude : fallbackLongitude}
          name={hasValidCoordinates && locationData.name ? locationData.name : fallbackName}
          onLocationUpdate={onLocationUpdate}
          editable={true}
        />
        <div className="p-4 border-t border-border/30">
          <Button 
            variant="outline" 
            className="w-full mb-4 flex items-center justify-center gap-2" 
            onClick={handleGetCurrentLocation}
            disabled={gettingUserLocation}
          >
            <Locate className="h-4 w-4" />
            {gettingUserLocation 
              ? t("Getting location...", "获取位置中...") 
              : t("Use my current location", "使用我的当前位置")}
          </Button>
          <div className="text-sm text-muted-foreground mb-3">
            {t("Search for another location", "搜索其他位置")}
          </div>
          <MapSelector onSelectLocation={handleLocationSearch} />
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationUpdater;
