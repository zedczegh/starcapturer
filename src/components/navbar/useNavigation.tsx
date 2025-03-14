
import { useMemo } from "react";
import { useSiqsNavigation } from "@/hooks/navigation/useSiqsNavigation";

export const useNavigation = (locationId: string | null, beijingData: any, isLoading: boolean, setIsLoading: (value: boolean) => void) => {
  // Use memoization to prevent redundant calculations
  const { handleSIQSClick } = useSiqsNavigation();
  
  // Memoize the return value to prevent unnecessary rerenders
  return useMemo(() => ({
    handleSIQSClick
  }), [handleSIQSClick]); // Only recreate when handleSIQSClick changes
};
