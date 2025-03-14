
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

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
    
    // Ensure we have valid Beijing data with the correct name
    const beijingLocation = {
      ...beijingData,
      name: "北京", // Explicitly set the name to ensure it's correct
      id: `beijing-${Date.now()}`
    };
    
    // Navigate to home with Beijing data
    navigate("/", { 
      state: beijingLocation
    });
    
    setIsLoading(false);
  }, [navigate, beijingData, isLoading, setIsLoading]);

  return { handleSIQSClick };
};
