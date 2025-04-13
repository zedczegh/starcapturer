
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
    console.log("useLocationInit effect triggered with:", { id, hasInitialState: !!initialState });
    
    // Skip initialization if we already have location data
    if (locationData) {
      console.log("Already have location data, skipping initialization");
      setIsLoading(false);
      return;
    }

    const initData = async () => {
      await initializeLocationData({
        id,
        initialState,
        navigate,
        toast,
        t,
        language,
        setLocationData,
        setIsLoading
      });
    };

    initData();
  }, [id, initialState, navigate, t, toast, language, locationData]);

  return {
    locationData,
    setLocationData,
    isLoading
  };
};
