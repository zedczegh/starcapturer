
import { toast } from "sonner";
import { NavigateFunction } from "react-router-dom";
import { getLocationDetailsById } from "@/utils/locationStorage";
import { calculateMoonPhase } from "@/utils/siqsValidation";

/**
 * Centralized function to initialize location data from various sources
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
  id: string | undefined;
  initialState: any;
  navigate: NavigateFunction;
  toast: any;
  t: any;
  language: string;
  setLocationData: (data: any) => void;
  setIsLoading: (loading: boolean) => void;
}) => {
  try {
    // Check if id is valid
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      console.error("Invalid or missing location ID:", id);
      navigate("/"); // Redirect to home page if invalid ID
      setIsLoading(false);
      return;
    }

    // Priority 1: Use data from route state if it exists
    if (initialState?.locationData) {
      console.log("Using location data from route state");
      setLocationData(initialState.locationData);
      setIsLoading(false);
      return;
    }

    // Priority 2: Try to load from localStorage by id
    const storedData = getLocationDetailsById(id);
    if (storedData) {
      console.log(`Found stored location: ${storedData.name}`);
      
      // Update moon phase calculation if needed
      if (!storedData.moonPhase) {
        storedData.moonPhase = calculateMoonPhase();
      }
      
      setLocationData(storedData);
      setIsLoading(false);
      return;
    }

    // If we get here, we couldn't find the location
    console.error("Location not found");
    toast({
      title: t("Location not found", "找不到位置"),
      description: t(
        "The location you requested could not be found. Redirecting to home page.",
        "无法找到您请求的位置。正在重定向到主页。"
      ),
      duration: 3000,
    });

    // Redirect to home page
    navigate("/", { replace: true });
  } catch (error) {
    console.error("Error initializing location data:", error);
    toast({
      title: t("Error", "错误"),
      description: t(
        "An error occurred while loading the location. Redirecting to home page.",
        "加载位置时发生错误。正在重定向到主页。"
      ),
      duration: 3000,
    });
    
    // Redirect to home page
    navigate("/", { replace: true });
  } finally {
    setIsLoading(false);
  }
};
