
import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavigateFunction } from "react-router-dom";
import { initializeLocationData } from "./locationInitializer";
import { getLocationDetailsById, saveLocationDetails } from "@/utils/locationStorage";

// Re-export handleLocationChange from the dedicated module
export { handleLocationChange } from "./locationChangeHandler";

/**
 * Hook to initialize location data from state or localStorage
 */
export const useLocationInit = (
  id: string | undefined,
  initialState: any,
  navigate: NavigateFunction,
  noRedirect: boolean = false
) => {
  const [locationData, setLocationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initAttempted, setInitAttempted] = useState(false);
  const locationIdRef = useRef<string | undefined>(id);
  const initStateRef = useRef(initialState);
  const loadCompletedRef = useRef(false);
  
  const { t, language } = useLanguage();
  const { toast } = useToast();

  // Safely update location data with persistence
  const updateLocationDataSafely = useCallback((newData: any) => {
    if (!newData) return;
    
    try {
      // Ensure we have valid data with required fields
      const safeData = {
        ...newData,
        id: newData.id || id,
        timestamp: newData.timestamp || new Date().toISOString()
      };
      
      setLocationData(safeData);
      
      // Also save to localStorage for persistence
      if (id) {
        saveLocationDetails(id, safeData);
        console.log("Location data saved to localStorage for ID:", id);
      }
    } catch (error) {
      console.error("Error updating location data:", error);
    }
  }, [id]);

  // Memoized function to handle initialization
  const handleInitialization = useCallback(() => {
    if (!id || initAttempted || loadCompletedRef.current) return;
    
    setInitAttempted(true);
    console.log("LocationInit: Initializing with state:", initialState);

    // Check for local storage backup first
    if (!initialState && id) {
      console.log("Checking for localStorage backup for ID:", id);
      const storedData = getLocationDetailsById(id);
      
      if (storedData) {
        console.log("Found location data in localStorage:", storedData);
        updateLocationDataSafely(storedData);
        setIsLoading(false);
        loadCompletedRef.current = true;
        return;
      }
    }

    // Initialize from state data
    if (initialState) {
      console.log("Initializing from provided state data:", initialState);
      updateLocationDataSafely(initialState);
      setIsLoading(false);
      loadCompletedRef.current = true;
      return;
    }

    // If we reach here, we need to initialize from external sources or handle missing data
    if (noRedirect) {
      // If noRedirect is true, just set loading to false and return null
      // The parent component will handle getting the current location
      console.log("No location data found, but noRedirect flag is set. Letting parent component handle it.");
      setIsLoading(false);
      loadCompletedRef.current = true;
      return;
    }

    // Initialize from external sources
    initializeLocationData({
      id,
      initialState,
      navigate,
      toast,
      t,
      language,
      setLocationData: updateLocationDataSafely,
      setIsLoading
    });
    
    loadCompletedRef.current = true;
  }, [id, initialState, navigate, t, toast, language, initAttempted, updateLocationDataSafely, noRedirect]);

  // Handle location data initialization on mount and when deps change
  useEffect(() => {
    // Reset if ID changes
    if (id !== locationIdRef.current) {
      locationIdRef.current = id;
      initStateRef.current = initialState;
      loadCompletedRef.current = false;
      setInitAttempted(false);
    }
    
    // Don't reinitialize if we already have data
    if (locationData) {
      setIsLoading(false);
      loadCompletedRef.current = true;
      return;
    }

    // Add a small delay to ensure router state is fully available
    const timeoutId = setTimeout(() => {
      handleInitialization();
    }, 50);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [handleInitialization, locationData, id, initialState]);

  return {
    locationData,
    setLocationData: updateLocationDataSafely,
    isLoading
  };
};
