
import React, { useEffect, useState, useCallback, memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Locate, Search, MapPin } from "lucide-react";
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
  const [showSelector, setShowSelector] = useState(false);
  const [lastTranslationRequest, setLastTranslationRequest] = useState<string | null>(null);

  // Avoid unnecessary effect runs on initial mount
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Create a debounced translation request key
  const translationRequestKey = useMemo(() => {
    if (!currentLocation) return null;
    return `${currentLocation.latitude}-${currentLocation.longitude}-${language}`;
  }, [currentLocation, language]);

  // Update location name when language changes, only for non-special locations
  useEffect(() => {
    if (!isMounted || !currentLocation || !translationRequestKey) return;
    
    // Skip if we've already processed this exact request
    if (translationRequestKey === lastTranslationRequest) return;
    
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
        
        // Update the last translation request to prevent duplicates
        setLastTranslationRequest(translationRequestKey);
      } catch (error) {
        console.error("Error updating location name on language change:", error);
      }
    };
    
    updateLocationNameOnLanguageChange();
  }, [translationRequestKey, currentLocation, onLocationUpdate, setCachedData, getCachedData, isMounted, language, lastTranslationRequest]);

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
      
      // Reset last translation request when manually selecting a location
      setLastTranslationRequest(null);
      setShowSelector(false);
      
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
          
          // Reset last translation request when getting current location
          setLastTranslationRequest(`${latitude}-${longitude}-${language}`);
          
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

  const toggleLocationSelector = useCallback(() => {
    setShowSelector(prev => !prev);
  }, []);

  // Performance optimization - only re-render the buttons when necessary
  const actionButtons = useMemo(() => (
    <div className="flex gap-2 mb-4">
      <Button 
        variant="outline" 
        className="flex-1 flex items-center justify-center gap-2 sci-fi-btn bg-cosmic-800/70 border-primary/30 text-primary-foreground hover:bg-primary/20" 
        onClick={handleGetCurrentLocation}
        disabled={gettingUserLocation}
      >
        <Locate className="h-4 w-4" />
        {gettingUserLocation 
          ? t("Retrieving...", "获取中...") 
          : t("My location", "我的位置")}
      </Button>
      
      <Button 
        variant="outline" 
        className="flex-1 flex items-center justify-center gap-2 sci-fi-btn bg-cosmic-800/70 border-primary/30 text-primary-foreground hover:bg-primary/20"
        onClick={toggleLocationSelector}
      >
        <Search className="h-4 w-4" />
        {t("Search", "搜索")}
      </Button>
    </div>
  ), [gettingUserLocation, handleGetCurrentLocation, t, toggleLocationSelector]);

  // Current location display
  const currentLocationDisplay = useMemo(() => {
    if (!currentLocation) return null;
    
    return (
      <div className="mb-4 p-3 rounded-md bg-cosmic-800/50 border border-cosmic-600/20 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
        <div className="text-sm truncate flex-1">
          {currentLocation.name}
        </div>
      </div>
    );
  }, [currentLocation]);

  return (
    <div className="p-4 border-t border-cosmic-600/10 bg-cosmic-800/30 relative z-10">
      {currentLocationDisplay}
      {actionButtons}
      
      {showSelector && (
        <div className="relative z-30 animate-fade-in">
          <div className="absolute top-0 w-full">
            <div className="p-4 bg-cosmic-900/95 backdrop-blur-sm rounded-md border border-cosmic-600/30 shadow-lg">
              <h3 className="text-sm font-medium mb-3 text-primary-foreground">
                {t("Search for a location", "搜索位置")}
              </h3>
              <MapSelector onSelectLocation={handleLocationSearch} />
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-3 text-xs"
                onClick={() => setShowSelector(false)}
              >
                {t("Cancel", "取消")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(LocationControls);
