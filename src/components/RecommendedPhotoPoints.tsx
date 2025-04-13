
import React from "react";
import PhotoPointCard from "./photoPoints/PhotoPointCard";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CurrentLocationReminder from "./photoPoints/CurrentLocationReminder";
import { useRecommendedPhotoPointsData } from "./photoPoints/hooks/useRecommendedPhotoPointsData";
import EmptyRecommendations from "./photoPoints/EmptyRecommendations";
import RecommendationsFooter from "./photoPoints/RecommendationsFooter";

interface RecommendedPhotoPointsProps {
  onSelectPoint?: (point: SharedAstroSpot) => void;
  userLocation: { latitude: number; longitude: number } | null;
  limit?: number;
  hideEmptyMessage?: boolean;
}

const RecommendedPhotoPoints: React.FC<RecommendedPhotoPointsProps> = ({
  onSelectPoint,
  userLocation,
  limit = 3,
  hideEmptyMessage = false,
}) => {
  const {
    limitedLocations,
    localLoading,
    searching,
    cachedLocations,
    currentSiqs
  } = useRecommendedPhotoPointsData(userLocation, limit);
  
  if (localLoading && cachedLocations.length === 0) {
    return (
      <div className="mt-2 flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
      </div>
    );
  }

  if (limitedLocations.length === 0) {
    return (
      <EmptyRecommendations 
        userLocation={userLocation}
        hideEmptyMessage={hideEmptyMessage} 
      />
    );
  }
  
  return (
    <div className="mt-2">
      {/* Show reminder based on actual current SIQS value */}
      {currentSiqs !== null && (
        <CurrentLocationReminder 
          currentSiqs={currentSiqs}
          isVisible={true} 
        />
      )}
      
      <AnimatePresence>
        <div className="space-y-3 mt-3">
          {limitedLocations.map((location, index) => (
            <motion.div
              key={`${location.id || location.latitude}-${location.longitude}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: index * 0.03 }}
            >
              <PhotoPointCard
                point={location}
                onSelect={onSelectPoint}
                onViewDetails={() => onSelectPoint?.(location)}
                userLocation={userLocation}
              />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      <RecommendationsFooter 
        hasLocations={limitedLocations.length > 0}
        searching={searching}
      />
    </div>
  );
};

export default RecommendedPhotoPoints;
