
import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGeolocation } from "@/hooks/location/useGeolocation";
import { useLanguage } from "@/contexts/LanguageContext";

export const useSiqsNavigation = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const navigationInProgress = useRef(false);
  
  // Set up geolocation for direct access
  const geo = useGeolocation({ 
    enableHighAccuracy: true, 
    timeout: 15000,
    maximumAge: 60000,
    language 
  });

  const handleSIQSClick = useCallback((e?: React.MouseEvent) => {
    // Prevent multiple rapid clicks
    if (navigationInProgress.current) return;
    navigationInProgress.current = true;
    
    // If there's an onClick in a parent component, we don't want to trigger it
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Navigate directly to the calculator section on homepage
    navigate("/");
    
    // After a short delay, trigger location request automatically
    setTimeout(() => {
      navigationInProgress.current = false;
      const useLocationButton = document.querySelector('[data-location-button="true"]');
      if (useLocationButton && useLocationButton instanceof HTMLButtonElement) {
        useLocationButton.click();
      }
    }, 300);
  }, [navigate]);

  return { handleSIQSClick, getPosition: geo.getPosition };
};
