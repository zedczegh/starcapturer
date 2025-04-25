
import React, { useEffect } from "react";
import { useSiqsCalculatorState } from "./siqs/hooks/useSiqsCalculatorState";
import { useLocationHandlers } from "./siqs/hooks/useLocationHandlers";
import { useSIQSAdvancedSettings } from "./siqs/hooks/useSIQSAdvancedSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import CalculatorContainer from "./siqs/calculator/CalculatorContainer";
import RecommendationsSection from "./siqs/calculator/RecommendationsSection";
import LocationSelector from "./siqs/LocationSelector";
import SIQSScore from "./siqs/SIQSScore";
import SIQSCalculatorHeader from "./siqs/SIQSCalculatorHeader";
import StatusMessage from "./siqs/StatusMessage";
import { currentSiqsStore } from "./index/CalculatorSection";
import { motion } from "framer-motion";
import { animationVariants } from "./siqs/calculator/utils/animationUtils";
import { logSiqsCalculation } from "@/services/siqs/siqsLogger";

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
  
  const {
    loading,
    statusMessage,
    calculationInProgress,
    localBortleScale,
    locationSelectorProps,
    isMounted,
    siqsScore,
    calculateSIQSForLocation,
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
    calculateSIQSForLocation,
    setStatusMessage,
    language,
    seeingConditions: 2.5
  });

  const parsedLatitude = parseFloat(latitude || "0") || 0;
  const parsedLongitude = parseFloat(longitude || "0") || 0;

  const { seeingConditions } = useSIQSAdvancedSettings(parsedLatitude, parsedLongitude);

  useEffect(() => {
    if (locationName && parsedLatitude !== 0 && parsedLongitude !== 0) {
      currentSiqsStore.metadata.setMetadata(locationName, parsedLatitude, parsedLongitude);
      
      if (localBortleScale && !calculationInProgress) {
        setLoading(true);
        
        setTimeout(() => {
          if (siqsScore !== null) {
            currentSiqsStore.setValue(siqsScore);
            
            if (onSiqsCalculated) {
              onSiqsCalculated(siqsScore);
            }
          }
          setLoading(false);
        }, 300);
      }
    }
  }, [locationName, parsedLatitude, parsedLongitude, localBortleScale, onSiqsCalculated, calculationInProgress, setLoading, siqsScore]);

  useEffect(() => {
    if (siqsScore !== null && !loading && !calculationInProgress && parsedLatitude && parsedLongitude) {
      let astroNightCloudCover: number | null = null;

      if (weatherData?.nighttimeCloudData?.average !== undefined) {
        astroNightCloudCover = weatherData.nighttimeCloudData.average;
      } else if (forecastData?.astro_night_cloud_cover !== undefined) {
        astroNightCloudCover = forecastData.astro_night_cloud_cover;
      } else if (weatherData?.cloudCover !== undefined) {
        astroNightCloudCover = weatherData.cloudCover;
      }

      logSiqsCalculation({
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        locationName: locationName || "Unknown",
        siqsScore: siqsScore,
        astroNightCloudCover,
        additionalMetadata: {
          language,
          source: "SIQSCalculator"
        }
      });
    }
  }, [
    siqsScore,
    loading,
    calculationInProgress,
    parsedLatitude,
    parsedLongitude,
    locationName,
    weatherData,
    forecastData,
    language
  ]);

  const showRecommendations = !hideRecommendedPoints && !loading && !calculationInProgress && (!statusMessage || statusMessage === '');

  return (
    <CalculatorContainer className={className}>
      <SIQSCalculatorHeader />
      
      <motion.div variants={animationVariants} transition={{ delay: 0.1 }}>
        <StatusMessage message={statusMessage} loading={calculationInProgress || loading} />
      </motion.div>
      
      {siqsScore !== null && (
        <motion.div variants={animationVariants} transition={{ delay: 0.2 }}>
          <SIQSScore 
            siqsScore={siqsScore} 
            latitude={parsedLatitude}
            longitude={parsedLongitude}
            locationName={locationName}
          />
        </motion.div>
      )}
      
      <motion.div className="space-y-4" variants={animationVariants} transition={{ delay: 0.3 }}>
        <LocationSelector 
          locationName={locationName} 
          loading={loading || calculationInProgress} 
          handleUseCurrentLocation={handleUseCurrentLocation}
          onSelectLocation={handleLocationSelect}
          noAutoLocationRequest={locationSelectorProps.noAutoLocationRequest}
        />
        
        <RecommendationsSection 
          onSelectPoint={handleRecommendedPointSelect}
          userLocation={userLocation}
          showRecommendations={showRecommendations}
        />
      </motion.div>
    </CalculatorContainer>
  );
};

export default React.memo(SIQSCalculator);
