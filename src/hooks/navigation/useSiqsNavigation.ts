
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useGeolocation } from "@/hooks/location/useGeolocation";
import { useLanguage } from "@/contexts/LanguageContext";

export const useSiqsNavigation = () => {
  const navigate = useNavigate();
  
  // Set up geolocation for direct access
  const geo = useGeolocation({ 
    enableHighAccuracy: true, 
    timeout: 15000,
    maximumAge: 60000
  });

  const handleSIQSClick = useCallback((e?: React.MouseEvent) => {
    // If there's an onClick in a parent component, we don't want to trigger it
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Navigate directly to the homepage first, then to the calculator section
    // This ensures we're on a clean state
    navigate("/", { replace: true });
    
    // After a short delay, scroll to calculator section
    setTimeout(() => {
      const calculatorSection = document.getElementById("calculator-section");
      if (calculatorSection) {
        calculatorSection.scrollIntoView({ behavior: "smooth" });
      }
      
      // After a short delay, trigger location request automatically
      setTimeout(() => {
        const useLocationButton = document.querySelector('[data-location-button="true"]');
        if (useLocationButton && useLocationButton instanceof HTMLButtonElement) {
          useLocationButton.click();
        }
      }, 300);
    }, 100);
  }, [navigate]);

  return { handleSIQSClick, getPosition: geo.getPosition };
};
