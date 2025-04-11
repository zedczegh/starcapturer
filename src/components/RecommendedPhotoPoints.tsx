import React, { useMemo, useState, useEffect } from "react";
import { usePhotoPointsSearch } from "@/hooks/usePhotoPointsSearch";
import PhotoPointCard from "./photoPoints/PhotoPointCard";
import { SharedAstroSpot } from "@/lib/types/sharedTypes";
import { Button } from "./ui/button";
import { ChevronRight, Loader2, MapPin } from "lucide-react";
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
  const [isInitialized, setIsInitialized] = useState(false);
  const currentSiqs = currentSiqsStore.getValue();
  const [localLoading, setLocalLoading] = useState(true);
  const [cachedLocations, setCachedLocations] = useState<SharedAstroSpot[]>([]);
  
  useEffect(() => {
    try {
      const savedLocations = localStorage.getItem('cachedRecommendedLocations');
      if (savedLocations) {
        const parsed = JSON.parse(savedLocations);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCachedLocations(parsed);
          setLocalLoading(false);
        }
      }
    } catch (error) {
      console.error("Error loading cached locations:", error);
    }
  }, []);
  
  const {
    displayedLocations,
    loading,
    searching
  } = usePhotoPointsSearch({
    userLocation,
    currentSiqs,
    maxInitialResults: limit + 5 // Request more to ensure we have enough even after filtering
  });

  useEffect(() => {
    if (!loading && !isInitialized && displayedLocations.length > 0) {
      setIsInitialized(true);
      setLocalLoading(false);
      
      try {
        localStorage.setItem('cachedRecommendedLocations', JSON.stringify(displayedLocations));
      } catch (error) {
        console.error("Error saving locations to cache:", error);
      }
    }
  }, [loading, isInitialized, displayedLocations]);

  const limitedLocations = useMemo(() => {
    const locationsToUse = displayedLocations.length > 0 ? displayedLocations : cachedLocations;
    
    const certified = locationsToUse.filter(loc => 
      loc.isDarkSkyReserve || loc.certification
    );
    
    const nonCertified = locationsToUse.filter(loc => 
      !loc.isDarkSkyReserve && !loc.certification
    );
    
    const sortedLocations = [
      ...certified,
      ...nonCertified
    ].slice(0, limit);
    
    return sortedLocations;
  }, [displayedLocations, cachedLocations, limit]);

  if (localLoading && cachedLocations.length === 0) {
    return (
      <div className="mt-2 flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
      </div>
    );
  }

  if (limitedLocations.length === 0 && !hideEmptyMessage) {
    return (
      <div className="mt-2 text-center py-6">
        <p className="text-sm text-muted-foreground">
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
        
        {userLocation && (
          <Button 
            variant="outline" 
            size="sm"
            className="mt-4 bg-gradient-to-r from-blue-500/20 to-green-500/20 hover:from-blue-500/30 hover:to-green-500/30"
            onClick={() => {
              document.dispatchEvent(
                new CustomEvent('expand-search-radius', { detail: { radius: 1000 } })
              );
            }}
          >
            <MapPin className="h-3.5 w-3.5 mr-1.5" />
            {t("Expand Search", "扩大搜索")}
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="mt-2">
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

      {limitedLocations.length > 0 && (
        <div className="mt-4 flex justify-center">
          <Link to="/photo-points">
            <Button
              variant="ghost"
              size="sm"
              className="bg-gradient-to-r from-blue-500/10 to-green-500/10 hover:from-blue-500/20 hover:to-green-500/20 text-primary/90 hover:text-primary"
            >
              {t("View All Photo Points", "查看所有摄影点")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {searching && (
        <div className="flex justify-center mt-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary/60" />
        </div>
      )}
    </div>
  );
};

export default RecommendedPhotoPoints;
