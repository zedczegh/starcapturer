
import { useState } from "react";
import { useSiqsNavigation } from "@/hooks/navigation/useSiqsNavigation";

export const useNavigation = (locationId: string | null, beijingData: any, isLoading: boolean, setIsLoading: (value: boolean) => void) => {
  // Use the SIQS navigation hook without passing any arguments
  const { handleSIQSClick } = useSiqsNavigation();
  
  return { handleSIQSClick };
};
