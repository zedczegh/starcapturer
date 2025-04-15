
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavigateFunction } from "react-router-dom";
import { initializeLocationData } from "./locationInitializer";
import { getLocationDetailsById } from "@/utils/locationStorage";

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
  const [initAttempted, setInitAttempted] = useState(false);
  
  const { t, language } = useLanguage();
  const { toast } = useToast();

  // Memoized function to handle initialization
  const handleInitialization = useCallback(() => {
    if (!id || initAttempted) return;
    
    setInitAttempted(true);
    console.log("LocationInit: Initializing with state:", initialState);

    // Check for local storage backup first
    if (!initialState && id) {
      console.log("Checking for localStorage backup for ID:", id);
      const storedData = getLocationDetailsById(id);
      
      if (storedData) {
        console.log("Found location data in localStorage:", storedData);
        setLocationData(storedData);
        setIsLoading(false);
        return;
      }
    }

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
  }, [id, initialState, navigate, t, toast, language, initAttempted]);

  // Initialize location data from state or localStorage
  useEffect(() => {
    if (locationData) {
      setIsLoading(false);
      return;
    }

    handleInitialization();
  }, [handleInitialization, locationData]);

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
