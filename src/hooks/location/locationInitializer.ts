
import { toast } from "sonner";
import { calculateMoonPhase } from "@/utils/siqsValidation";
import { NavigateFunction } from "react-router-dom";
import { getLatestLocation, dispatchLatestLocationUpdate } from "@/services/locationSyncService";

interface InitializeLocationDataProps {
  id: string | undefined;
  initialState: any;
  navigate: NavigateFunction;
  toast: any;
  t: (en: string, zh: string) => string;
  language: string;
  setLocationData: (data: any) => void;
  setIsLoading: (isLoading: boolean) => void;
}

/**
 * Initialize location data from state, localStorage, or redirect
 */
export const initializeLocationData = ({
  id,
  initialState,
  navigate,
  toast,
  t,
  language,
  setLocationData,
  setIsLoading
}: InitializeLocationDataProps) => {
  try {
    // Check if ID is missing or invalid
    if (!id) {
      console.error("Invalid or missing location ID:", { _type: typeof id, value: id });
      
      // Attempt to recover from localStorage
      const savedLocation = getLatestLocation();
      if (savedLocation) {
        console.log("Redirecting to home page with saved location");
        navigate("/");
        
        // Ensure latest location is dispatched to update other components
        dispatchLatestLocationUpdate();
      } else {
        // No saved location, redirect to home
        navigate("/");
      }
      
      setIsLoading(false);
      return;
    }

    // Check if we have initialState from navigation
    if (initialState?.locationData) {
      console.log("Using location data from navigation state");
      setLocationData(initialState.locationData);
      setIsLoading(false);
      
      // Cache the data for future use
      try {
        localStorage.setItem(`location_${id}`, JSON.stringify(initialState.locationData));
      } catch (e) {
        console.error("Failed to save location data to localStorage", e);
      }
      return;
    }

    // Try to load data from localStorage
    const savedLocationData = localStorage.getItem(`location_${id}`);
    if (savedLocationData) {
      console.log("Using location data from localStorage");
      const parsedData = JSON.parse(savedLocationData);
      
      // Update moonPhase as it may have changed
      parsedData.moonPhase = calculateMoonPhase();
      
      setLocationData(parsedData);
      setIsLoading(false);
      return;
    }

    // If we get here, we couldn't find the location
    console.error("Location not found");
    navigate("/");
    
    // Show error toast
    toast({
      title: t("Location not found", "未找到位置"),
      description: t("Please try again", "请重试"),
      variant: "destructive",
    });
    
    setIsLoading(false);
  } catch (error) {
    console.error("Error initializing location data:", error);
    navigate("/");
    setIsLoading(false);
  }
};
