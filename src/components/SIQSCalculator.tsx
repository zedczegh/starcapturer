
import React, { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import RecommendedPhotoPoints from "./RecommendedPhotoPoints";
import { useSiqsCalculatorState } from "./siqs/hooks/useSiqsCalculatorState";
import { useSIQSAdvancedSettings } from "./siqs/hooks/useSIQSAdvancedSettings";
import LocationSelector from "./siqs/LocationSelector";
import SIQSScore from "./siqs/SIQSScore";
import SIQSCalculatorHeader from "./siqs/SIQSCalculatorHeader";
import StatusMessage from "./siqs/StatusMessage";
import { motion } from "framer-motion";
import { useLocationHandlers } from "./siqs/hooks/useLocationHandlers";
import { currentSiqsStore } from "./index/CalculatorSection";
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
    // Make sure we have access to weather and forecast data for logging
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

      // Get nighttime cloud cover from the appropriate source
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

  const animationVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24 
      }
    }
  };

  const showRecommendations = !hideRecommendedPoints && !loading && !calculationInProgress && (!statusMessage || statusMessage === '');

  return (
    <motion.div 
      className={`glassmorphism-strong rounded-xl p-6 ${className} shadow-lg hover:shadow-xl transition-all duration-300 bg-cosmic-800/60 backdrop-blur-sm`}
      initial="hidden"
      animate="visible"
      variants={animationVariants}
    >
      <SIQSCalculatorHeader />
      
      <motion.div 
        variants={animationVariants}
        transition={{ delay: 0.1 }}
      >
        <StatusMessage message={statusMessage} loading={calculationInProgress || loading} />
      </motion.div>
      
      {siqsScore !== null && (
        <motion.div 
          variants={animationVariants}
          transition={{ delay: 0.2 }}
        >
          <SIQSScore 
            siqsScore={siqsScore} 
            latitude={parsedLatitude}
            longitude={parsedLongitude}
            locationName={locationName}
          />
        </motion.div>
      )}
      
      <motion.div 
        className="space-y-4"
        variants={animationVariants}
        transition={{ delay: 0.3 }}
      >
        <LocationSelector 
          locationName={locationName} 
          loading={loading || calculationInProgress} 
          handleUseCurrentLocation={handleUseCurrentLocation}
          onSelectLocation={handleLocationSelect}
          noAutoLocationRequest={locationSelectorProps.noAutoLocationRequest}
        />
        
        {showRecommendations && (
          <motion.div 
            variants={animationVariants}
            transition={{ delay: 0.4 }}
            initial="hidden"
            animate="visible"
            className="min-h-[100px]"
          >
            <RecommendedPhotoPoints 
              onSelectPoint={handleRecommendedPointSelect}
              userLocation={userLocation}
              hideEmptyMessage={true}
            />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default React.memo(SIQSCalculator);
