
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCurrentPosition } from "@/utils/geolocationUtils";
import { useLocationSelectorState } from "@/components/siqs/hooks/useLocationSelectorState";
import { useLocationDataCache } from "@/hooks/useLocationData";

interface LocationErrorProps {
  message?: string;
  onUseCurrentLocation?: () => void;
  isLoading?: boolean;
  autoLocate?: boolean;
}

const LocationError: React.FC<LocationErrorProps> = ({ 
  message,
  onUseCurrentLocation,
  isLoading = false,
  autoLocate = true
}) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { getCachedData, setCachedData } = useLocationDataCache();
  const [autoLocationAttempted, setAutoLocationAttempted] = useState(false);
  const [locationFound, setLocationFound] = useState(false);
  
  // Auto-trigger location fetch on component mount if autoLocate is true
  useEffect(() => {
    if (autoLocate && !autoLocationAttempted && !isLoading) {
      setAutoLocationAttempted(true);
      handleCurrentLocation();
    }
  }, [autoLocate, autoLocationAttempted, isLoading]);
  
  const handleCurrentLocation = useCallback(() => {
    if (onUseCurrentLocation) {
      onUseCurrentLocation();
      return;
    }
    
    // No toast here
    
    getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        setLocationFound(true);
        
        // Create a minimal location object
        const locationId = `loc-${latitude.toFixed(6)}-${longitude.toFixed(6)}`;
        
        // Generate location data with basic information
        const locationData = {
          id: locationId,
          name: t("Current Location", "当前位置"),
          latitude,
          longitude,
          timestamp: new Date().toISOString()
        };
        
        // Navigate to the generated location
        navigate(`/location/${locationId}`, { 
          state: locationData,
          replace: true 
        });
      },
      (error) => {
        console.error("Error getting location:", error);
        // No toast for error either
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0, language }
    );
  }, [onUseCurrentLocation, navigate, t, language]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold mb-4">{t("Location Not Found", "位置未找到")}</h1>
          <p className="text-muted-foreground mb-6">
            {message || t("The location information you're looking for doesn't exist or has expired.", 
               "您正在查找的位置信息不存在或已过期。")}
          </p>
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
            <Button 
              onClick={handleCurrentLocation} 
              className="bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>{t("Loading...", "加载中...")}</span>
              ) : (
                <span>{t("Use My Current Location", "使用我的当前位置")}</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationError;
