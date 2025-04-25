
import React, { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiqsCalculatorState } from "./siqs/hooks/useSiqsCalculatorState";
import { useLocationHandlers } from "./siqs/hooks/useLocationHandlers";
import { useSIQSAdvancedSettings } from "./siqs/hooks/useSIQSAdvancedSettings";
import { useSiqsCalculator } from "@/hooks/siqs/useSiqsCalculator";
import { currentSiqsStore } from "./index/CalculatorSection";
import CalculatorContainer from "./siqs/calculator/CalculatorContainer";
import SIQSCalculatorHeader from "./siqs/SIQSCalculatorHeader";
import CalculatorStatus from "./siqs/calculator/CalculatorStatus";
import ScoreDisplay from "./siqs/calculator/ScoreDisplay";
import LocationInputSection from "./siqs/calculator/LocationInputSection";

interface SIQSCalculatorProps {
  className?: string;
  hideRecommendedPoints?: boolean;
  noAutoLocationRequest?: boolean;
  onSiqsCalculated?: (siqsValue: number | null) => void;
}

const SIQSCalculator: React.FC<SIQSCalculatorProps> = ({ 
  className,
  hideRecommendedPoints = false,
  noAutoLocationRequest = false,
  onSiqsCalculated
}) => {
  const { language } = useLanguage();
  const { calculateSiqs } = useSiqsCalculator();
  
  const {
    loading,
    statusMessage,
    calculationInProgress,
    localBortleScale,
    locationSelectorProps,
    isMounted,
    siqsScore,
    setStatusMessage,
    setLoading,
    weatherData,
    forecastData
  } = useSiqsCalculatorState({
    noAutoLocationRequest,
    onSiqsCalculated
  });

  const {
    userLocation,
    locationName,
    latitude,
    longitude,
    handleUseCurrentLocation,
    handleLocationSelect,
    handleRecommendedPointSelect
  } = useLocationHandlers({
    locationSelectorProps,
    isMounted,
    setLocalBortleScale: locationSelectorProps.setBortleScale,
    calculateSIQSForLocation: calculateSiqs,
    setStatusMessage,
    language,
    seeingConditions: 2.5
  });

  const parsedLatitude = parseFloat(latitude || "0") || 0;
  const parsedLongitude = parseFloat(longitude || "0") || 0;

  useEffect(() => {
    if (locationName && parsedLatitude !== 0 && parsedLongitude !== 0) {
      currentSiqsStore.metadata.setMetadata(locationName, parsedLatitude, parsedLongitude);
      
      if (localBortleScale && !calculationInProgress) {
        setLoading(true);
        setTimeout(() => {
          if (siqsScore !== null) {
            currentSiqsStore.setValue(siqsScore);
            onSiqsCalculated?.(siqsScore);
          }
          setLoading(false);
        }, 300);
      }
    }
  }, [locationName, parsedLatitude, parsedLongitude, localBortleScale, onSiqsCalculated, calculationInProgress, setLoading, siqsScore]);

  const showRecommendations = !hideRecommendedPoints && !loading && !calculationInProgress && (!statusMessage || statusMessage === '');

  return (
    <CalculatorContainer className={className}>
      <SIQSCalculatorHeader />
      
      <CalculatorStatus 
        message={statusMessage}
        loading={loading}
        calculationInProgress={calculationInProgress}
      />
      
      <ScoreDisplay 
        siqsScore={siqsScore}
        latitude={parsedLatitude}
        longitude={parsedLongitude}
        locationName={locationName}
      />
      
      <LocationInputSection 
        locationName={locationName}
        loading={loading}
        calculationInProgress={calculationInProgress}
        handleUseCurrentLocation={handleUseCurrentLocation}
        handleLocationSelect={handleLocationSelect}
        handleRecommendedPointSelect={handleRecommendedPointSelect}
        userLocation={userLocation}
        showRecommendations={showRecommendations}
        noAutoLocationRequest={noAutoLocationRequest}
      />
    </CalculatorContainer>
  );
};

export default React.memo(SIQSCalculator);
