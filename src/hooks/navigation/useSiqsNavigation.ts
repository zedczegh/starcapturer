
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useGeolocation } from "@/hooks/location/useGeolocation";

export const useSiqsNavigation = () => {
  const navigate = useNavigate();
  
  // Set up geolocation for direct access - removing invalid language option
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
    
    // Navigate to community page (home)
    navigate("/", { replace: true });
    
    // Scroll to top of page
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  }, [navigate]);

  return { handleSIQSClick, getPosition: geo.getPosition };
};
