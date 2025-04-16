
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import RecommendedPhotoPoints from "./RecommendedPhotoPoints";
import { useSiqsCalculatorState } from "./siqs/hooks/useSiqsCalculatorState";
import { useSIQSAdvancedSettings } from "./siqs/hooks/useSIQSAdvancedSettings"; // Fixed import
import LocationSelector from "./siqs/LocationSelector";
import SIQSScore from "./siqs/SIQSScore";
import SIQSCalculatorHeader from "./siqs/SIQSCalculatorHeader";
import StatusMessage from "./siqs/StatusMessage";
import { motion } from "framer-motion";
import { useLocationHandlers } from "./siqs/hooks/useLocationHandlers";

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
    latitude, // Added latitude
    longitude // Added longitude
  } = useSiqsCalculatorState({
    noAutoLocationRequest,
    onSiqsCalculated
  });
  
  // Parse latitude and longitude for SIQS settings
  const parsedLatitude = parseFloat(latitude || "0") || 0;
  const parsedLongitude = parseFloat(longitude || "0") || 0;
  
  // Get advanced settings
  const { seeingConditions } = useSIQSAdvancedSettings(parsedLatitude, parsedLongitude);
  
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
    seeingConditions
  });
  
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
        <StatusMessage message={statusMessage} loading={calculationInProgress} />
      </motion.div>
      
      {siqsScore !== null && (
        <motion.div 
          variants={animationVariants}
          transition={{ delay: 0.2 }}
        >
          <SIQSScore 
            siqsScore={siqsScore} 
            latitude={parseFloat(latitude)}
            longitude={parseFloat(longitude)}
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
        
        {!hideRecommendedPoints && (
          <motion.div 
            variants={animationVariants}
            transition={{ delay: 0.4 }}
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
