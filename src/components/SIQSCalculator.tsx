
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
  
  // Use our custom hooks for state management
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
    setLoading
  } = useSiqsCalculatorState({
    noAutoLocationRequest,
    onSiqsCalculated
  });
  
  // Location handling
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
    seeingConditions: 2.5 // Default value before we get actual seeing conditions
  });
  
  // Parse latitude and longitude for SIQS settings
  const parsedLatitude = parseFloat(latitude || "0") || 0;
  const parsedLongitude = parseFloat(longitude || "0") || 0;
  
  // Get advanced settings
  const { seeingConditions } = useSIQSAdvancedSettings(parsedLatitude, parsedLongitude);
  
  // When location changes, update the metadata
  useEffect(() => {
    if (locationName && parsedLatitude !== 0 && parsedLongitude !== 0) {
      // Update metadata in global store
      currentSiqsStore.metadata.setMetadata(locationName, parsedLatitude, parsedLongitude);
      
      // If we have a Bortle scale, update the SIQS value in the global store
      if (localBortleScale && !calculationInProgress) {
        setLoading(true);
        
        // Simulate loading to ensure state updates properly
        setTimeout(() => {
          if (siqsScore !== null) {
            // Update the SIQS score in the global store
            currentSiqsStore.setValue(siqsScore);
            
            // Notify through provided callback
            if (onSiqsCalculated) {
              onSiqsCalculated(siqsScore);
            }
          }
          setLoading(false);
        }, 300);
      }
    }
  }, [locationName, parsedLatitude, parsedLongitude, localBortleScale, onSiqsCalculated, calculationInProgress, setLoading, siqsScore]);
  
  // Animation variants
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

  // Determine whether to show recommendations (prevent flickering by ensuring statusMessage is null)
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
