
import React from "react";
import { motion } from "framer-motion";
import RecommendedPhotoPoints from "@/components/RecommendedPhotoPoints";
import { animationVariants } from "./utils/animationUtils";
import type { GeoLocation } from "@/types/location";

interface RecommendationsSectionProps {
  onSelectPoint: (point: any) => void;
  userLocation: GeoLocation | null;
  showRecommendations: boolean;
}

const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  onSelectPoint,
  userLocation,
  showRecommendations
}) => {
  if (!showRecommendations) return null;

  return (
    <motion.div 
      variants={animationVariants}
      transition={{ delay: 0.4 }}
      initial="hidden"
      animate="visible"
      className="min-h-[100px]"
    >
      <RecommendedPhotoPoints 
        onSelectPoint={onSelectPoint}
        userLocation={userLocation}
        hideEmptyMessage={true}
      />
    </motion.div>
  );
};

export default React.memo(RecommendationsSection);
