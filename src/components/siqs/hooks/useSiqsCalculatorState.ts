
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocationDataCache } from "@/hooks/useLocationData";
import { useSIQSCalculation } from "@/hooks/useSIQSCalculation";
import { Language } from "@/services/geocoding/types";
import { getLocationNameForCoordinates } from "@/components/location/map/LocationNameService";
import { getSavedLocation, saveLocation } from "@/utils/locationStorage";
import { currentSiqsStore } from '@/components/index/CalculatorSection';

export function useSiqsCalculatorState({
  noAutoLocationRequest = false,
  onSiqsCalculated
}: {
  noAutoLocationRequest?: boolean;
  onSiqsCalculated?: (siqsValue: number | null) => void;
}) {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [calculationInProgress, setCalculationInProgress] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [localBortleScale, setLocalBortleScale] = useState<number | null>(null);
  const [shouldAutoRequest, setShouldAutoRequest] = useState(!noAutoLocationRequest);
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  
  const { setCachedData, getCachedData } = useLocationDataCache();
  
  useEffect(() => {
    if (!isMounted) {
      const savedLocation = getSavedLocation();
      if (savedLocation) {
        console.log("Found saved location:", savedLocation.name);
        setShouldAutoRequest(false);
      }
    }
  }, [isMounted]);
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  const locationSelectorProps = useMemo(() => ({
    language: language as Language,
    noAutoLocationRequest: noAutoLocationRequest || !shouldAutoRequest,
    bortleScale: localBortleScale,
    setBortleScale: setLocalBortleScale,
    setStatusMessage,
    setShowAdvancedSettings: () => {},
    getCachedData,
    setCachedData,
    latitude,
    longitude,
    setLatitude,
    setLongitude
  }), [language, noAutoLocationRequest, shouldAutoRequest, localBortleScale, setStatusMessage, getCachedData, setCachedData, latitude, longitude]);

  const {
    setCachedData: setSiqsCachedData, 
    getCachedData: getSiqsCachedData
  } = useLocationDataCache();

  const {
    isCalculating,
    siqsScore,
    calculateSIQSForLocation
  } = useSIQSCalculation(setSiqsCachedData, getSiqsCachedData);
  
  useEffect(() => {
    setCalculationInProgress(isCalculating);
  }, [isCalculating]);
  
  useEffect(() => {
    if (onSiqsCalculated) {
      onSiqsCalculated(siqsScore);
      // Also update the global store
      currentSiqsStore.setValue(siqsScore);
    }
  }, [siqsScore, onSiqsCalculated]);
  
  return {
    loading,
    setLoading,
    statusMessage,
    setStatusMessage,
    calculationInProgress,
    localBortleScale,
    setLocalBortleScale,
    locationSelectorProps,
    isMounted,
    siqsScore,
    calculateSIQSForLocation,
    language,
    latitude,
    setLatitude,
    longitude,
    setLongitude
  };
}
