
import React, { useMemo, useState, useEffect } from "react";
import { usePhotoPointsSearch } from "@/hooks/usePhotoPointsSearch";
import PhotoPointCard from "./photoPoints/PhotoPointCard";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { Button } from "./ui/button";
import { ChevronRight, Loader2, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { useSiqsStore } from "@/stores/siqsStore";
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
  const currentSiqs = useSiqsStore.getState().score;
  const [localLoading, setLocalLoading] = useState(true);
  const [cachedLocations, setCachedLocations] = useState<SharedAstroSpot[]>([]);
  
  // Start with cached data if available from localStorage
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

  // Mark as initialized after initial load and save to cache
  useEffect(() => {
    if (!loading && !isInitialized && displayedLocations.length > 0) {
      setIsInitialized(true);
      setLocalLoading(false);
      
      // Save to localStorage for faster future loads
      try {
        localStorage.setItem('cachedRecommendedLocations', JSON.stringify(displayedLocations));
      } catch (error) {
        console.error("Error saving locations to cache:", error);
      }
    }
  }, [loading, isInitialized, displayedLocations]);

  // Only show limited number of locations
  const limitedLocations = useMemo(() => {
    // Use fresh data if available, otherwise use cached data
    const locationsToUse = displayedLocations.length > 0 ? displayedLocations : cachedLocations;
    
    // Prioritize certified locations 
    const certified = locationsToUse.filter(loc => 
      loc.isDarkSkyReserve || loc.certification
    );
    
    const nonCertified = locationsToUse.filter(loc => 
      !loc.isDarkSkyReserve && !loc.certification
    );
    
    // Combine with certified locations first, then add non-certified
    // to fill up to the limit
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
        
        {userLocation && (
          <Button 
            variant="outline" 
            size="sm"
            className="mt-4"
            onClick={() => {
              // Trigger event to find more locations
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
      <CurrentLocationReminder 
        currentSiqs={currentSiqs}
        isVisible={limitedLocations.length > 0}
      />
      
      <AnimatePresence>
        <div className="space-y-3">
          {limitedLocations.map((location, index) => (
            <motion.div
              key={`${location.id || location.latitude}-${location.longitude}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: index * 0.03 }} // Faster animations
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
        <div className="flex justify-center mt-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary/60" />
        </div>
      )}
    </div>
  );
};

export default RecommendedPhotoPoints;
