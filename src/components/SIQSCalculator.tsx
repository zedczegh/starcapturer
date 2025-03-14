
import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import RecommendedPhotoPoints from "./RecommendedPhotoPoints";
import { useLocationDataCache } from "@/hooks/useLocationData";
import { useSIQSCalculation } from "@/hooks/useSIQSCalculation";
import LocationSelector from "./siqs/LocationSelector";
import SIQSScore from "./siqs/SIQSScore";
import SIQSCalculatorHeader from "./siqs/SIQSCalculatorHeader";
import StatusMessage from "./siqs/StatusMessage";
import { useLocationSelectorState } from "./siqs/hooks/useLocationSelectorState";
import useSIQSAdvancedSettings from "./siqs/hooks/useSIQSAdvancedSettings";
import { Language } from "@/services/geocoding/types";
import { useSIQSCalculatorState } from "@/hooks/siqs/useSIQSCalculatorState";

interface SIQSCalculatorProps {
  className?: string;
  hideRecommendedPoints?: boolean;
  noAutoLocationRequest?: boolean;
}

const SIQSCalculator: React.FC<SIQSCalculatorProps> = ({ 
  className,
  hideRecommendedPoints = false,
  noAutoLocationRequest = false
}) => {
  const { language } = useLanguage();
  const { setCachedData, getCachedData } = useLocationDataCache();
  
  const {
    loading,
    statusMessage,
    setStatusMessage,
    calculationInProgress,
    setCalculationInProgress,
    isMounted,
    localBortleScale,
    setLocalBortleScale,
    updateLocationNameForLanguage
  } = useSIQSCalculatorState({
    language: language as Language,
    noAutoLocationRequest,
    getCachedData,
    setCachedData
  });
  
  // Use extracted hook for location selection state
  const locationSelectorProps = {
    language: language as Language,
    noAutoLocationRequest,
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
    handleUseCurrentLocation,
    handleLocationSelect,
    handleRecommendedPointSelect
  } = useLocationSelectorState(locationSelectorProps);

  // Parse latitude and longitude for hook usage
  const parsedLatitude = parseFloat(latitude) || 0;
  const parsedLongitude = parseFloat(longitude) || 0;
  
  // Pass the parsed coordinates to the hook
  const { seeingConditions, bortleScale } = useSIQSAdvancedSettings(parsedLatitude, parsedLongitude);

  // Update local Bortle scale when hook value changes
  useEffect(() => {
    if (bortleScale !== undefined) {
      setLocalBortleScale(bortleScale);
    }
  }, [bortleScale, setLocalBortleScale]);

  const {
    isCalculating,
    siqsScore,
    calculateSIQSForLocation
  } = useSIQSCalculation(setCachedData, getCachedData);
  
  // Update location name when language changes
  useEffect(() => {
    if (!isMounted || !latitude || !longitude || !locationName) return;
    
    // Skip special locations
    if (locationName === "北京" || locationName === "Beijing") return;
    
    updateLocationNameForLanguage(locationName, latitude, longitude)
      .then(newName => {
        if (newName && newName !== locationName) {
          setLocationName(newName);
        }
      });
  }, [language, latitude, longitude, locationName, updateLocationNameForLanguage, setLocationName, isMounted]);
  
  // Track calculation state for loading indicator
  useEffect(() => {
    setCalculationInProgress(isCalculating);
  }, [isCalculating, setCalculationInProgress]);
  
  // Calculate SIQS when inputs change
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
  }, [latitude, longitude, locationName, localBortleScale, seeingConditions, language, calculateSIQSForLocation, setStatusMessage, setCalculationInProgress]);
  
  // Debounced SIQS calculation
  useEffect(() => {
    if (!isMounted || !locationName) return;
    
    const handler = setTimeout(() => {
      calculateSIQS();
    }, 500);
    
    return () => clearTimeout(handler);
  }, [latitude, longitude, locationName, localBortleScale, seeingConditions, calculateSIQS, isMounted]);
  
  return (
    <div className={`glassmorphism-strong rounded-xl p-6 ${className} shadow-lg hover:shadow-xl transition-all duration-300`}>
      <SIQSCalculatorHeader />
      
      <StatusMessage message={statusMessage} loading={calculationInProgress} />
      
      {siqsScore !== null && (
        <SIQSScore 
          siqsScore={siqsScore} 
          latitude={parsedLatitude}
          longitude={parsedLongitude}
          locationName={locationName}
        />
      )}
      
      <div className="space-y-4">
        <LocationSelector 
          locationName={locationName} 
          loading={loading || calculationInProgress} 
          handleUseCurrentLocation={handleUseCurrentLocation}
          onSelectLocation={handleLocationSelect}
        />
        
        {!hideRecommendedPoints && (
          <RecommendedPhotoPoints 
            onSelectPoint={handleRecommendedPointSelect}
            userLocation={userLocation}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(SIQSCalculator);
