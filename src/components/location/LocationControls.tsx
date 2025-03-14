
import React, { useEffect, useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Locate } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import MapSelector from "@/components/MapSelector";
import { useToast } from "@/hooks/use-toast";
import { useLocationDataCache } from "@/hooks/useLocationData";
import { getLocationNameForCoordinates } from "./map/LocationNameService";

interface LocationControlsProps {
  onLocationUpdate: (location: { name: string; latitude: number; longitude: number }) => Promise<void>;
  gettingUserLocation: boolean;
  setGettingUserLocation: (state: boolean) => void;
  setStatusMessage: (message: string | null) => void;
  currentLocation?: { latitude: number; longitude: number; name: string } | null;
}

const LocationControls: React.FC<LocationControlsProps> = ({
  onLocationUpdate,
  gettingUserLocation,
  setGettingUserLocation,
  setStatusMessage,
  currentLocation
}) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { setCachedData, getCachedData } = useLocationDataCache();
  const [isMounted, setIsMounted] = useState(false);

  // Avoid unnecessary effect runs on initial mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update location name when language changes, only for non-special locations
  useEffect(() => {
    if (!isMounted || !currentLocation) return;
    
    // Skip special locations like Beijing
    if (currentLocation.name === "北京" || currentLocation.name === "Beijing") return;
    
    const updateLocationNameOnLanguageChange = async () => {
      try {
        const locationName = await getLocationNameForCoordinates(
          currentLocation.latitude,
          currentLocation.longitude,
          language,
          { setCachedData, getCachedData }
        );
        
        // Only update if the name changed to avoid unnecessary re-renders
        if (locationName && locationName !== currentLocation.name) {
          await onLocationUpdate({
            name: locationName,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude
          });
        }
      } catch (error) {
        console.error("Error updating location name on language change:", error);
      }
    };
    
    updateLocationNameOnLanguageChange();
  }, [language, currentLocation, onLocationUpdate, setCachedData, getCachedData, isMounted]);

  // Memoize the location search handler
  const handleLocationSearch = useCallback((selectedLocation: { 
    name: string; 
    latitude: number; 
    longitude: number;
    placeDetails?: string;
  }) => {
    try {
      const locationName = selectedLocation.name || 
        `${t("Location at", "位置在")} ${selectedLocation.latitude.toFixed(4)}°, ${selectedLocation.longitude.toFixed(4)}°`;
      
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
  }, [onLocationUpdate, t, setStatusMessage, toast]);

  // Memoize the get current location handler
  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatusMessage(t("Geolocation is not supported by your browser.", "您的浏览器不支持地理定位。"));
      return;
    }

    setGettingUserLocation(true);
    setStatusMessage(t("Retrieving location data...", "正在获取位置数据..."));

    const locationTimeout = setTimeout(() => {
      if (gettingUserLocation) {
        setGettingUserLocation(false);
        setStatusMessage(t("Could not get your location in time. Please try again.", "无法及时获取您的位置。请重试。"));
      }
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(locationTimeout);
        try {
          const { latitude, longitude } = position.coords;
          
          const locationName = await getLocationNameForCoordinates(
            latitude, 
            longitude, 
            language, 
            { setCachedData, getCachedData }
          );
          
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
            errorMessage = t("You denied the request for geolocation.", "您拒绝了地理定位请求。");
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = t("Location information is unavailable.", "位置信息不可用。");
            break;
          case error.TIMEOUT:
            errorMessage = t("The request to get location timed out.", "获取位置请求超时。");
            break;
        }
        
        setStatusMessage(errorMessage);
        setGettingUserLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [t, setStatusMessage, setGettingUserLocation, gettingUserLocation, onLocationUpdate, language, setCachedData, getCachedData]);

  return (
    <div className="p-4 border-t border-cosmic-600/10 bg-cosmic-800/30 relative z-10">
      <Button 
        variant="outline" 
        className="w-full mb-4 flex items-center justify-center gap-2 sci-fi-btn bg-cosmic-800/70 border-primary/30 text-primary-foreground hover:bg-primary/20" 
        onClick={handleGetCurrentLocation}
        disabled={gettingUserLocation}
      >
        <Locate className="h-4 w-4" />
        {gettingUserLocation 
          ? t("Retrieving location data...", "获取位置数据中...") 
          : t("Use my current location", "使用我的当前位置")}
      </Button>
      <div className="relative z-30">
        <MapSelector onSelectLocation={handleLocationSearch} />
      </div>
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(LocationControls);
