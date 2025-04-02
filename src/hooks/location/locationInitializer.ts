import { calculateMoonPhase } from "@/utils/siqsValidation";
import { toast } from "@/hooks/use-toast";
import { NavigateFunction } from "react-router-dom";

/**
 * Initialize location data from state or localStorage
 */
export const initializeLocationData = async ({
  id,
  initialState,
  navigate,
  toast,
  t,
  language,
  setLocationData,
  setIsLoading
}: {
  id: string | undefined,
  initialState: any,
  navigate: NavigateFunction,
  toast: any,
  t: any,
  language: string,
  setLocationData: (data: any) => void,
  setIsLoading: (loading: boolean) => void
}) => {
  try {
    // If we have initial state from navigation, use it
    if (initialState) {
      console.log("Initializing location from navigation state");
      
      // Add default values for missing properties
      const enhancedData = {
        ...initialState,
        moonPhase: initialState.moonPhase || calculateMoonPhase(),
        seeingConditions: initialState.seeingConditions || 3,
        bortleScale: initialState.bortleScale || 5
      };
      
      setLocationData(enhancedData);
      setIsLoading(false);
      return;
    }

    // Otherwise try to load from localStorage
    if (id) {
      try {
        // Check localStorage for saved location
        const savedLocation = localStorage.getItem(`location_${id}`);
        if (savedLocation) {
          console.log("Loading location from localStorage");
          const parsedLocation = JSON.parse(savedLocation);
          
          // Check if data is valid
          if (parsedLocation && 
              parsedLocation.latitude && 
              parsedLocation.longitude && 
              parsedLocation.name) {
            
            setLocationData(parsedLocation);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load from localStorage", e);
      }
    }

    // If we reach here, we couldn't recover location data
    console.error("Could not load location data");
    
    // Show error message and navigate back
    toast({
      title: t(
        "Location not found", 
        "找不到位置"
      ),
      description: t(
        "The location you requested could not be found.", 
        "找不到您请求的位置。"
      ),
      variant: "destructive",
    });
    
    // Navigate back to home
    navigate("/", { replace: true });
  } catch (error) {
    console.error("Error initializing location data:", error);
    
    // Show error
    toast({
      title: t(
        "Error loading location",
        "加载位置时出错"
      ),
      description: t(
        "An error occurred while loading the location data.",
        "加载位置数据时发生错误。"
      ),
      variant: "destructive",
    });
    
    // Navigate back to home
    navigate("/", { replace: true });
  } finally {
    setIsLoading(false);
  }
};
