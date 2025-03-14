
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import RecommendedPhotoPoints from "./RecommendedPhotoPoints";
import { useCurrentLocation, useLocationDataCache } from "@/hooks/useLocationData";
import { useSIQSCalculation } from "@/hooks/useSIQSCalculation";
import LocationSelector from "./siqs/LocationSelector";
import SIQSScore from "./siqs/SIQSScore";
import SIQSCalculatorHeader from "./siqs/SIQSCalculatorHeader";
import StatusMessage from "./siqs/StatusMessage";
import { useLocationSelectorState } from "./siqs/hooks/useLocationSelectorState";
import useSIQSAdvancedSettings from "./siqs/hooks/useSIQSAdvancedSettings";

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
  
  const { setCachedData, getCachedData } = useLocationDataCache();
  
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
  } = useLocationSelectorState({
    language,
    noAutoLocationRequest,
    bortleScale: 4, // Default value
    setBortleScale: () => {}, // No-op function since we don't allow changing bortleScale anymore
    setStatusMessage,
    setShowAdvancedSettings: () => {}, // No-op function since we don't use this anymore
    getCachedData,
    setCachedData
  });

  // Parse latitude and longitude for hook usage
  const parsedLatitude = parseFloat(latitude) || 0;
  const parsedLongitude = parseFloat(longitude) || 0;
  
  // Pass the parsed coordinates to the hook
  const { seeingConditions, bortleScale } = useSIQSAdvancedSettings(parsedLatitude, parsedLongitude);

  const {
    isCalculating,
    siqsScore,
    validateInputs,
    calculateSIQSForLocation
  } = useSIQSCalculation(setCachedData, getCachedData);
  
  useEffect(() => {
    // Track calculation state for loading indicator
    setCalculationInProgress(isCalculating);
  }, [isCalculating]);
  
  useEffect(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (!locationName || isNaN(lat) || isNaN(lng)) return;
    
    const handler = setTimeout(() => {
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
          language
        )
        .finally(() => {
          setCalculationInProgress(false);
        });
      }
    }, 500); // Debounce for better performance
    
    return () => clearTimeout(handler);
  }, [latitude, longitude, locationName, bortleScale, seeingConditions, language, calculateSIQSForLocation, setStatusMessage]);
  
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

export default SIQSCalculator;
