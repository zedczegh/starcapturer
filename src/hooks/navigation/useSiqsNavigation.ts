
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export const useSiqsNavigation = (
  locationId: string | null,
  beijingData: any,
  isLoading: boolean,
  setIsLoading: (value: boolean) => void
) => {
  const navigate = useNavigate();

  const handleSIQSClick = useCallback(() => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    // Create a clean copy of the Beijing data with explicit properties
    const beijingLocation = {
      id: `beijing-${Date.now()}`,
      name: "北京", // Ensure the name is explicitly "北京"
      latitude: beijingData?.latitude || 39.9042,
      longitude: beijingData?.longitude || 116.4074,
      bortleScale: beijingData?.bortleScale || 8,
      seeingConditions: beijingData?.seeingConditions || 3,
      // Copy other properties if they exist
      weatherData: beijingData?.weatherData || null,
      moonPhase: beijingData?.moonPhase || 0.5,
      timestamp: new Date().toISOString()
    };
    
    // Navigate to home with Beijing data
    navigate("/", { 
      state: beijingLocation
    });
    
    setIsLoading(false);
  }, [navigate, beijingData, isLoading, setIsLoading]);

  return { handleSIQSClick };
};
