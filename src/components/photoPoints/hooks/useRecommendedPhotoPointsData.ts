
import { useState, useEffect, useMemo } from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { usePhotoPointsSearch } from "@/hooks/usePhotoPointsSearch";
import { currentSiqsStore } from "@/stores/siqsStore";
import { updateLocationsWithRealTimeSiqs } from "@/services/realTimeSiqsService/locationUpdateService";

export function useRecommendedPhotoPointsData(
  userLocation: { latitude: number; longitude: number } | null,
  limit: number = 3
) {
  const [isInitialized, setIsInitialized] = useState(false);
  const currentSiqs = currentSiqsStore.getValue();
  const [localLoading, setLocalLoading] = useState(true);
  const [cachedLocations, setCachedLocations] = useState<SharedAstroSpot[]>([]);
  const [enhancedLocations, setEnhancedLocations] = useState<SharedAstroSpot[]>([]);
  
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
    const sortedLocations = [
      ...certified,
      ...nonCertified
    ].slice(0, limit);
    
    return sortedLocations;
  }, [enhancedLocations, displayedLocations, cachedLocations, limit]);

  return {
    limitedLocations,
    localLoading,
    searching,
    loading,
    cachedLocations,
    currentSiqs
  };
}
