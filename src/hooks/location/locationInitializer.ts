
import { calculateMoonPhase } from "@/utils/siqsValidation";
import { fetchWeatherData } from "@/lib/api";
import { NavigateFunction } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface InitializeLocationDataParams {
  id: string | undefined;
  initialState: any;
  navigate: NavigateFunction;
  toast: any;
  t: (en: string, zh: string) => string;
  language: string;
  setLocationData: (data: any) => void;
  setIsLoading: (loading: boolean) => void;
  noRedirect?: boolean;
}

/**
 * Initialize location data from either initialState or localStorage
 */
export async function initializeLocationData({
  id,
  initialState,
  navigate,
  toast,
  t,
  language,
  setLocationData,
  setIsLoading,
  noRedirect = false
}: InitializeLocationDataParams) {
  try {
    // First priority: use initialState passed from the router
    if (initialState && initialState.latitude && initialState.longitude) {
      console.log("Setting location data from state:", initialState);
      
      // Check if weatherData is missing or has zeros for critical values
      const needsWeatherUpdate = 
        !initialState.weatherData || 
        initialState.weatherData.temperature === 0 || 
        initialState.weatherData.humidity === 0 || 
        initialState.weatherData.cloudCover === 0 || 
        initialState.weatherData.windSpeed === 0;
      
      // Ensure location data has fresh moon phase
      const dataWithFreshMoonPhase = {
        ...initialState,
        moonPhase: initialState.moonPhase || calculateMoonPhase(),
        // Preserve fromPhotoPoints flag if it exists
        fromPhotoPoints: initialState.fromPhotoPoints || false
      };
      
      setLocationData(dataWithFreshMoonPhase);
      
      // Also save to localStorage for persistence
      try {
        if (id) {
          localStorage.setItem(`location_${id}`, JSON.stringify(dataWithFreshMoonPhase));
        }
      } catch (e) {
        console.error("Failed to save to localStorage", e);
      }
      
      // If weatherData needs to be updated, trigger it immediately
      if (needsWeatherUpdate && initialState.latitude && initialState.longitude) {
        try {
          console.log("Updating weather data for location:", initialState.name);
          const freshWeatherData = await fetchWeatherData({
            latitude: initialState.latitude,
            longitude: initialState.longitude
          });
          
          if (freshWeatherData) {
            const updatedData = {
              ...dataWithFreshMoonPhase,
              weatherData: freshWeatherData,
              timestamp: new Date().toISOString()
            };
            
            setLocationData(updatedData);
            
            // Update localStorage
            try {
              if (id) {
                localStorage.setItem(`location_${id}`, JSON.stringify(updatedData));
              }
            } catch (e) {
              console.error("Failed to save updated data to localStorage", e);
            }
          }
        } catch (error) {
          console.error("Failed to update weather data:", error);
        }
      }
      
      // We've completely removed the redirection to homepage even if coordinates are invalid
    } else if (id) {
      // Second priority: try to load data from localStorage if available
      await loadFromLocalStorage(id, setLocationData, toast, t, navigate, language, true); // always pass noRedirect=true
    } else {
      console.log("No way to initialize location data", { params: id, locationState: initialState });
      // No action to take - let the parent component handle it
    }
  } finally {
    setIsLoading(false);
  }
}

/**
 * Load location data from localStorage if available
 */
async function loadFromLocalStorage(
  id: string,
  setLocationData: (data: any) => void,
  toast: any,
  t: (en: string, zh: string) => string,
  navigate: NavigateFunction,
  language: string,
  noRedirect: boolean = false
) {
  console.log("Trying to load location data from localStorage for ID:", id);
  const savedLocationData = localStorage.getItem(`location_${id}`);
  
  if (savedLocationData) {
    const parsedData = JSON.parse(savedLocationData);
    
    // Ensure we have a fresh moon phase
    parsedData.moonPhase = parsedData.moonPhase || calculateMoonPhase();
    
    // Check if we need to update weather data
    const needsWeatherUpdate = 
      !parsedData.weatherData || 
      parsedData.weatherData.temperature === 0 || 
      parsedData.weatherData.humidity === 0 || 
      parsedData.weatherData.cloudCover === 0 || 
      parsedData.weatherData.windSpeed === 0;
    
    setLocationData(parsedData);
    
    // If weatherData needs to be updated, trigger it immediately
    if (needsWeatherUpdate && parsedData.latitude && parsedData.longitude) {
      try {
        console.log("Updating weather data for stored location:", parsedData.name);
        const freshWeatherData = await fetchWeatherData({
          latitude: parsedData.latitude,
          longitude: parsedData.longitude
        });
        
        if (freshWeatherData) {
          const updatedData = {
            ...parsedData,
            weatherData: freshWeatherData,
            timestamp: new Date().toISOString()
          };
          
          setLocationData(updatedData);
          
          // Update localStorage
          try {
            localStorage.setItem(`location_${id}`, JSON.stringify(updatedData));
          } catch (e) {
            console.error("Failed to save updated data to localStorage", e);
          }
        }
      } catch (error) {
        console.error("Failed to update weather data:", error);
      }
    }
  } else {
    console.log("Location data not found in localStorage", { id });
    // We no longer redirect to homepage, just return and let parent component handle it
  }
}

/**
 * Show error toast but don't redirect
 * This function has been modified to only show errors without redirecting
 */
function showErrorAndRedirect(
  toast: any, 
  t: (en: string, zh: string) => string, 
  navigate: NavigateFunction,
  errorEn: string,
  errorZh: string
) {
  // Only show the toast, no redirection
  toast({
    title: t("Error", "错误"),
    description: t(errorEn, errorZh),
    variant: "destructive"
  });
  
  // No more redirection
  console.log("Error shown without redirection:", errorEn);
}
