
import { useState } from "react";
import { useSiqsNavigation } from "@/hooks/navigation/useSiqsNavigation";

export const useNavigation = (locationId: string | null, beijingData: any, isLoading: boolean, setIsLoading: (value: boolean) => void) => {
  // Use the extracted SIQS navigation hook
  const { handleSIQSClick } = useSiqsNavigation(locationId, beijingData, isLoading, setIsLoading);
  
  return { handleSIQSClick };
};
