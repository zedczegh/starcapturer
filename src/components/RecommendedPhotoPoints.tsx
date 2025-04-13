
import React, { useState, useEffect, useMemo } from "react";
import { usePhotoPointsSearch } from "@/hooks/usePhotoPointsSearch";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { currentSiqsStore } from "./index/CalculatorSection";
import CurrentLocationReminder from "./photoPoints/CurrentLocationReminder";
import { updateLocationsWithRealTimeSiqs } from "@/services/realTimeSiqsService/locationUpdateService";
import { loadCachedLocations, saveCachedLocations } from "./photoPoints/components/PhotoPointsCache";
import LocationsList from "./photoPoints/components/LocationsList";
import ViewAllButton from "./photoPoints/components/ViewAllButton";

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
  const [enhancedLocations, setEnhancedLocations] = useState<SharedAstroSpot[]>([]);
  
  // Start with cached data if available from localStorage
  useEffect(() => {
    const cached = loadCachedLocations();
    if (cached.length > 0) {
      setCachedLocations(cached);
      setLocalLoading(false);
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
      saveCachedLocations(displayedLocations);
    }
  }, [loading, isInitialized, displayedLocations]);

  // Apply real-time SIQS to recommended locations
  useEffect(() => {
    const locationsToEnhance = displayedLocations.length > 0 ? displayedLocations : cachedLocations;
    
    if (locationsToEnhance.length > 0) {
      const updateWithSiqs = async () => {
        try {
          // Apply real-time SIQS to all locations including certified ones
          const updated = await updateLocationsWithRealTimeSiqs(
            locationsToEnhance,
            userLocation,
            100000, // Large radius to include all locations
            'certified' // Treat all as certified to ensure updates
          );
          setEnhancedLocations(updated);
        } catch (err) {
          console.error("Error updating recommended locations with SIQS:", err);
          setEnhancedLocations(locationsToEnhance);
        }
      };
      
      updateWithSiqs();
    }
  }, [displayedLocations, cachedLocations, userLocation]);

  // Only show limited number of locations
  const limitedLocations = useMemo(() => {
    // Use enhanced data if available, otherwise fresh data, then cached data
    const locationsToUse = enhancedLocations.length > 0 
      ? enhancedLocations 
      : displayedLocations.length > 0 
        ? displayedLocations 
        : cachedLocations;
    
    // Prioritize certified locations 
    const certified = locationsToUse.filter(loc => 
      loc.isDarkSkyReserve || loc.certification
    );
    
    const nonCertified = locationsToUse.filter(loc => 
      !loc.isDarkSkyReserve && !loc.certification
    );
    
    // Combine with certified locations first, then add non-certified
    // to fill up to the limit
    return [...certified, ...nonCertified].slice(0, limit);
  }, [enhancedLocations, displayedLocations, cachedLocations, limit]);

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
      </div>
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
      
      <LocationsList 
        locations={limitedLocations}
        onSelectPoint={onSelectPoint}
        userLocation={userLocation}
      />

      {limitedLocations.length > 0 && <ViewAllButton />}

      {searching && (
        <div className="flex justify-center mt-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary/60" />
        </div>
      )}
    </div>
  );
};

export default RecommendedPhotoPoints;
