
import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocationDataCache } from '@/hooks/useLocationData';
import { useSIQSCalculation } from '@/hooks/useSIQSCalculation';
import { useLocationSelectorState } from '@/components/siqs/hooks/useLocationSelectorState';
import useSIQSAdvancedSettings from '@/components/siqs/hooks/useSIQSAdvancedSettings';
import { Language } from '@/services/geocoding/types';
import { getLocationNameForCoordinates } from '@/components/location/map/LocationNameService';
import { getSavedLocation, saveLocation } from '@/utils/locationStorage';
import { currentSiqsStore } from '@/stores/siqsStore';

interface UseSIQSCalculatorStateProps {
  noAutoLocationRequest?: boolean;
  onSiqsCalculated?: (siqsValue: number | null) => void;
}

export function useSIQSCalculatorState({
  noAutoLocationRequest = false,
  onSiqsCalculated
}: UseSIQSCalculatorStateProps = {}) {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [calculationInProgress, setCalculationInProgress] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [localBortleScale, setLocalBortleScale] = useState<number | null>(null);
  const [shouldAutoRequest, setShouldAutoRequest] = useState(!noAutoLocationRequest);
  
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
  
  const locationSelectorProps = {
    language: language as Language,
    noAutoLocationRequest: noAutoLocationRequest || !shouldAutoRequest,
    bortleScale: localBortleScale,
    setBortleScale: setLocalBortleScale,
    setStatusMessage,
    setShowAdvancedSettings: () => {},
    getCachedData,
    setCachedData
  };

  const {
    userLocation,
    locationName,
    latitude,
    longitude,
    setLocationName,
    setLatitude,
    setLongitude,
    handleUseCurrentLocation,
    handleLocationSelect,
    handleRecommendedPointSelect
  } = useLocationSelectorState(locationSelectorProps);

  const parsedLatitude = parseFloat(latitude) || 0;
  const parsedLongitude = parseFloat(longitude) || 0;
  
  const { seeingConditions, bortleScale } = useSIQSAdvancedSettings(parsedLatitude, parsedLongitude);

  useEffect(() => {
    if (bortleScale !== undefined) {
      setLocalBortleScale(bortleScale);
    }
  }, [bortleScale]);

  const {
    isCalculating,
    siqsScore,
    calculateSIQSForLocation
  } = useSIQSCalculation(setCachedData, getCachedData);
  
  useEffect(() => {
    if (!isMounted || !latitude || !longitude || !locationName) return;
    
    if (locationName === "北京" || locationName === "Beijing") return;
    
    const updateLocationNameForLanguage = async () => {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      if (isNaN(lat) || isNaN(lng)) return;
      
      try {
        const newName = await getLocationNameForCoordinates(
          lat, 
          lng, 
          language as Language, 
          { setCachedData, getCachedData }
        );
        
        if (newName && newName !== locationName) {
          setLocationName(newName);
        }
      } catch (error) {
        console.error("Error updating location name for language change:", error);
      }
    };
    
    updateLocationNameForLanguage();
  }, [language, latitude, longitude, locationName, setCachedData, getCachedData, setLocationName, isMounted]);
  
  useEffect(() => {
    setCalculationInProgress(isCalculating);
  }, [isCalculating]);
  
  useEffect(() => {
    if (!isMounted || !locationName || !latitude || !longitude) return;
    
    saveLocation({
      name: locationName,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      bortleScale: localBortleScale || undefined
    });
  }, [locationName, latitude, longitude, localBortleScale, isMounted]);
  
  useEffect(() => {
    if (!isMounted || noAutoLocationRequest) return;
    
    const savedLocation = getSavedLocation();
    if (savedLocation && !locationName) {
      setLocationName(savedLocation.name);
      setLatitude(savedLocation.latitude.toString());
      setLongitude(savedLocation.longitude.toString());
      if (savedLocation.bortleScale) {
        setLocalBortleScale(savedLocation.bortleScale);
      }
      console.log("Restored saved location:", savedLocation.name);
    }
  }, [isMounted, noAutoLocationRequest, locationName, setLocationName, setLatitude, setLongitude]);
  
  const calculateSIQS = useCallback(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (!locationName || isNaN(lat) || isNaN(lng)) return;
    
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setCalculationInProgress(true);
      calculateSIQSForLocation(
        lat, 
        lng, 
        locationName, 
        true, 
        localBortleScale, 
        seeingConditions,
        undefined,
        setStatusMessage,
        language as Language
      )
      .finally(() => {
        setCalculationInProgress(false);
      });
    }
  }, [latitude, longitude, locationName, localBortleScale, seeingConditions, language, calculateSIQSForLocation, setStatusMessage]);
  
  useEffect(() => {
    if (!isMounted || !locationName) return;
    
    const handler = setTimeout(() => {
      calculateSIQS();
    }, 500);
    
    return () => clearTimeout(handler);
  }, [latitude, longitude, locationName, localBortleScale, seeingConditions, calculateSIQS, isMounted]);
  
  useEffect(() => {
    if (onSiqsCalculated) {
      onSiqsCalculated(siqsScore);
      currentSiqsStore.setValue(siqsScore);
    }
  }, [siqsScore, onSiqsCalculated]);

  return {
    loading,
    statusMessage,
    calculationInProgress,
    userLocation,
    locationName,
    siqsScore,
    handleLocationSelect,
    handleUseCurrentLocation,
    handleRecommendedPointSelect,
    noAutoLocationRequest: noAutoLocationRequest || !shouldAutoRequest
  };
}
