
import React, { useMemo } from "react";
import { usePhotoPointsSearch } from "@/hooks/usePhotoPointsSearch";
import PhotoPointCard from "./photoPoints/PhotoPointCard";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { Button } from "./ui/button";
import { ChevronRight, MapPin, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { currentSiqsStore } from "./index/CalculatorSection";
import CurrentLocationReminder from "./photoPoints/CurrentLocationReminder";

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
  const { t } = useLanguage();
  const currentSiqs = currentSiqsStore.getScore();
  
  const {
    displayedLocations,
    loading,
    searching
  } = usePhotoPointsSearch({
    userLocation,
    currentSiqs,
    maxInitialResults: Math.max(limit * 2, 10) // Increased to get more locations, especially certified ones
  });

  // Show more locations with priority to certified ones
  const limitedLocations = useMemo(() => {
    // Prioritize certified locations 
    const certified = displayedLocations.filter(loc => 
      loc.isDarkSkyReserve || loc.certification
    );
    
    const nonCertified = displayedLocations.filter(loc => 
      !loc.isDarkSkyReserve && !loc.certification
    );
    
    // Take all certified locations up to the limit
    // If there's still room, add calculated locations
    let result = [];
    
    if (certified.length <= limit) {
      // If we have fewer certified locations than the limit,
      // include all certified and fill the rest with non-certified
      result = [
        ...certified,
        ...nonCertified.slice(0, limit - certified.length)
      ];
    } else {
      // If we have more certified locations than the limit,
      // just take the limit number of certified locations
      result = certified.slice(0, limit);
    }
    
    return result;
  }, [displayedLocations, limit]);

  if (loading) {
    return (
      <div className="mt-2 flex justify-center py-6">
        <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
      </div>
    );
  }

  if (limitedLocations.length === 0 && !hideEmptyMessage) {
    return (
      <div className="mt-2 text-center py-6">
        <p className="text-muted-foreground text-sm">
          {t(
            "No recommended photo points found nearby.",
            "在附近找不到推荐的摄影点。"
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t(
            "Try expanding your search radius.",
            "尝试扩大您的搜索半径。"
          )}
        </p>
      </div>
    );
  }
  
  return (
    <div className="mt-2">
      <CurrentLocationReminder 
        currentSiqs={currentSiqs}
        isVisible={limitedLocations.length > 0}
      />
      
      <AnimatePresence>
        <div className="space-y-3">
          {limitedLocations.map((location, index) => (
            <motion.div
              key={`${location.id || location.latitude}-${location.longitude}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
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

      {limitedLocations.length > 0 && (
        <div className="mt-4 flex justify-center">
          <Link to="/photo-points">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/90 hover:bg-primary/10"
            >
              {t("View All Photo Points", "查看所有摄影点")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {searching && (
        <div className="flex justify-center mt-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
        </div>
      )}
    </div>
  );
};

export default RecommendedPhotoPoints;
