
import { useState, useCallback } from "react";
import { useSiqsNavigation } from "@/hooks/navigation/useSiqsNavigation";
import { getCurrentPosition } from "@/utils/geolocationUtils";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export const useNavigation = (locationId: string | null, beijingData: any, isLoading: boolean, setIsLoading: (value: boolean) => void) => {
  const { handleSIQSClick } = useSiqsNavigation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const handleLocationClick = useCallback(() => {
    setIsLoading(true);
    getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationId = `loc-${latitude.toFixed(6)}-${longitude.toFixed(6)}`;
        
        // Navigate to location with state
        navigate(`/location/${locationId}`, {
          state: {
            id: locationId,
            name: t("Current Location", "当前位置"),
            latitude,
            longitude,
            timestamp: new Date().toISOString()
          }
        });
        
        setIsLoading(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsLoading(false);
      }
    );
  }, [navigate, setIsLoading, t]);
  
  return { 
    handleSIQSClick,
    handleLocationClick
  };
};
