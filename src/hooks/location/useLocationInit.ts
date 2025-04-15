
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavigateFunction } from "react-router-dom";
import { initializeLocationData } from "./locationInitializer";

// Re-export handleLocationChange from the dedicated module
export { handleLocationChange } from "./locationChangeHandler";

/**
 * Hook to initialize location data from state or localStorage
 */
export const useLocationInit = (
  id: string | undefined,
  initialState: any,
  navigate: NavigateFunction
) => {
  const [locationData, setLocationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { t, language } = useLanguage();
  const { toast } = useToast();

  // Initialize location data from state or localStorage
  useEffect(() => {
    if (locationData) {
      setIsLoading(false);
      return;
    }

    // Log navigation state for debugging
    console.log("LocationInit: Initializing with state:", initialState);

    initializeLocationData({
      id,
      initialState,
      navigate,
      toast,
      t,
      language,
      setLocationData,
      setIsLoading
    });
  }, [id, initialState, navigate, t, toast, language, locationData]);

  // Cache location data in localStorage for better persistence
  useEffect(() => {
    if (locationData && id) {
      try {
        localStorage.setItem(`location_${id}`, JSON.stringify(locationData));
      } catch (e) {
        console.error("Failed to save to localStorage", e);
      }
    }
  }, [locationData, id]);

  return {
    locationData,
    setLocationData,
    isLoading
  };
};
