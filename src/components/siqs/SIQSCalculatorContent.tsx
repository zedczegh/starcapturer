
import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import SIQSCalculatorHeader from "./SIQSCalculatorHeader";
import StatusMessage from "./StatusMessage";
import SIQSScore from "./SIQSScore";
import LocationSelector from "./LocationSelector";
import RecommendedPhotoPoints from "../RecommendedPhotoPoints";
import { SharedAstroSpot } from "@/lib/api/astroSpots";

interface SIQSCalculatorContentProps {
  className?: string;
  statusMessage: string | null;
  calculationInProgress: boolean;
  siqsScore: number | null;
  latitude: string;
  longitude: string;
  locationName: string;
  userLocation: { latitude: number; longitude: number } | null;
  hideRecommendedPoints?: boolean;
  noAutoLocationRequest: boolean;
  onSelectLocation: (location: string, latitude: number, longitude: number) => void;
  handleUseCurrentLocation: () => void;
  onRecommendedPointSelect: (point: SharedAstroSpot) => void;
}

const SIQSCalculatorContent: React.FC<SIQSCalculatorContentProps> = ({
  className,
  statusMessage,
  calculationInProgress,
  siqsScore,
  latitude,
  longitude,
  locationName,
  userLocation,
  hideRecommendedPoints = false,
  noAutoLocationRequest,
  onSelectLocation,
  handleUseCurrentLocation,
  onRecommendedPointSelect
}) => {
  const { t } = useLanguage();
  
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
          loading={calculationInProgress} 
          handleUseCurrentLocation={handleUseCurrentLocation}
          onSelectLocation={onSelectLocation}
          noAutoLocationRequest={noAutoLocationRequest}
        />
        
        {!hideRecommendedPoints && (
          <motion.div 
            variants={animationVariants}
            transition={{ delay: 0.4 }}
          >
            <RecommendedPhotoPoints 
              onSelectPoint={onRecommendedPointSelect}
              userLocation={userLocation}
              hideEmptyMessage={true}
            />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SIQSCalculatorContent;
