
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateMoonPhase } from "@/utils/siqsValidation";
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

    const initData = async () => {
      try {
        // First try to use the state passed to the component
        if (initialState) {
          console.log("Using initialState for location data", initialState);
          setLocationData(initialState);
          setIsLoading(false);
          
          // Save to localStorage for persistence
          if (id) {
            localStorage.setItem(`location_${id}`, JSON.stringify(initialState));
          }
          return;
        }
        
        // If no state, try to load from localStorage using the ID
        if (id) {
          try {
            console.log("Attempting to load location data from localStorage for ID:", id);
            const storedData = localStorage.getItem(`location_${id}`);
            if (storedData) {
              const parsedData = JSON.parse(storedData);
              setLocationData(parsedData);
              setIsLoading(false);
              return;
            } else {
              console.log("No data found in localStorage for this ID");
            }
          } catch (e) {
            console.error("Failed to retrieve location data from localStorage", e);
          }
        }
        
        // If we got here with no data, show error and redirect
        console.error("No location data available");
        setIsLoading(false);
        navigate("/");
        toast({
          title: t("Location not found", "位置未找到"),
          description: t("The requested location could not be found", "未找到请求的位置"),
          variant: "destructive",
        });
      } catch (error) {
        console.error("Error initializing location data:", error);
        setIsLoading(false);
        setLocationData(null);
      }
    };

    initData();
  }, [id, initialState, navigate, t, toast, language, locationData]);

  return {
    locationData,
    setLocationData,
    isLoading
  };
};
