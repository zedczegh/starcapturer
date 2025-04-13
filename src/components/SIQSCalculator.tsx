
import React from "react";
import { useSIQSCalculatorState } from "./siqs/hooks/useSIQSCalculatorState";
import SIQSCalculatorContent from "./siqs/SIQSCalculatorContent";

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
  const {
    statusMessage,
    calculationInProgress,
    userLocation,
    locationName,
    siqsScore,
    handleLocationSelect,
    handleUseCurrentLocation,
    handleRecommendedPointSelect,
    noAutoLocationRequest: effectiveNoAutoRequest
  } = useSIQSCalculatorState({
    noAutoLocationRequest,
    onSiqsCalculated
  });

  const latitude = userLocation?.latitude.toString() || "";
  const longitude = userLocation?.longitude.toString() || "";
  
  // Create wrapper function to adapt to the expected interface
  const onSelectLocation = (location: { name: string; latitude: number; longitude: number; placeDetails?: string }) => {
    handleLocationSelect(location);
  };
  
  return (
    <SIQSCalculatorContent
      className={className}
      statusMessage={statusMessage}
      calculationInProgress={calculationInProgress}
      siqsScore={siqsScore}
      latitude={latitude}
      longitude={longitude}
      locationName={locationName || ""}
      userLocation={userLocation}
      hideRecommendedPoints={hideRecommendedPoints}
      noAutoLocationRequest={effectiveNoAutoRequest}
      onSelectLocation={onSelectLocation}
      handleUseCurrentLocation={handleUseCurrentLocation}
      onRecommendedPointSelect={handleRecommendedPointSelect}
    />
  );
};

export default React.memo(SIQSCalculator);
