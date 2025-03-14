
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { getLocationNameForCoordinates } from "./location/map/LocationNameService";

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
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [calculationInProgress, setCalculationInProgress] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const { setCachedData, getCachedData } = useLocationDataCache();
  
  const locationSelectorProps = useMemo(() => ({
    language: language as Language,
    noAutoLocationRequest,
    bortleScale: 4, // Default value
    setBortleScale: () => {}, // No-op function since we don't allow changing bortleScale anymore
    setStatusMessage,
    setShowAdvancedSettings: () => {}, // No-op function since we don't use this anymore
    getCachedData,
    setCachedData
  }), [language, noAutoLocationRequest, setStatusMessage, getCachedData, setCachedData]);

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

  // Track component mount state to avoid unnecessary effects
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Parse latitude and longitude for hook usage
  const parsedLatitude = parseFloat(latitude) || 0;
  const parsedLongitude = parseFloat(longitude) || 0;
  
  // Pass the parsed coordinates to the hook
  const { seeingConditions, bortleScale } = useSIQSAdvancedSettings(parsedLatitude, parsedLongitude);

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
  
  // Track calculation state for loading indicator
  useEffect(() => {
    setCalculationInProgress(isCalculating);
  }, [isCalculating]);
  
  // Memoize the SIQS calculation for better performance
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
        bortleScale, 
        seeingConditions,
        undefined,
        setStatusMessage,
        language as Language
      )
      .finally(() => {
        setCalculationInProgress(false);
      });
    }
  }, [latitude, longitude, locationName, bortleScale, seeingConditions, language, calculateSIQSForLocation, setStatusMessage]);
  
  // Debounced SIQS calculation when inputs change
  useEffect(() => {
    if (!isMounted) return;
    
    const handler = setTimeout(() => {
      calculateSIQS();
    }, 500);
    
    return () => clearTimeout(handler);
  }, [latitude, longitude, locationName, bortleScale, seeingConditions, calculateSIQS, isMounted]);
  
  return (
    <div className={`glassmorphism-strong rounded-xl p-6 ${className} shadow-lg hover:shadow-xl transition-all duration-300`}>
      <SIQSCalculatorHeader />
      
      <StatusMessage message={statusMessage} loading={calculationInProgress} />
      
      {siqsScore !== null && (
        <SIQSScore 
          siqsScore={siqsScore} 
          latitude={parseFloat(latitude)}
          longitude={parseFloat(longitude)}
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
