
import { useState, useEffect, useCallback } from "react";
import { Language } from "@/services/geocoding/types";
import { getLocationNameForCoordinates } from "@/components/location/map/LocationNameService";

interface UseSIQSCalculatorStateProps {
  language: Language;
  noAutoLocationRequest?: boolean;
  getCachedData: (key: string, maxAge?: number) => any;
  setCachedData: (key: string, data: any) => void;
}

export function useSIQSCalculatorState({
  language,
  noAutoLocationRequest,
  getCachedData,
  setCachedData
}: UseSIQSCalculatorStateProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [calculationInProgress, setCalculationInProgress] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [localBortleScale, setLocalBortleScale] = useState<number | null>(null);
  
  // Track component mount state to avoid unnecessary effects
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  // Function to update location name when language changes
  const updateLocationNameForLanguage = useCallback(async (
    locationName: string, 
    latitude: string, 
    longitude: string
  ) => {
    if (!isMounted || !latitude || !longitude || !locationName) return;
    
    // Skip special locations
    if (locationName === "北京" || locationName === "Beijing") return;
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) return;
    
    try {
      const newName = await getLocationNameForCoordinates(
        lat, 
        lng, 
        language, 
        { setCachedData, getCachedData }
      );
      
      return newName;
    } catch (error) {
      console.error("Error updating location name for language change:", error);
      return null;
    }
  }, [language, setCachedData, getCachedData, isMounted]);
  
  return {
    loading,
    setLoading,
    statusMessage,
    setStatusMessage,
    calculationInProgress,
    setCalculationInProgress,
    isMounted,
    setIsMounted,
    localBortleScale,
    setLocalBortleScale,
    updateLocationNameForLanguage
  };
}
