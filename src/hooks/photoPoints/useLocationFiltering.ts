
import { useState, useCallback } from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { isMountainousLocation, calculateLocationScore } from "./locationTypeUtils";

// SIQS threshold (20% better than current location is considered significant)
// Lower threshold for mountain areas to ensure they're included
const SIQS_IMPROVEMENT_THRESHOLD = 1.2;
const SIQS_MOUNTAIN_THRESHOLD = 1.1;

export function useLocationFiltering(
  allLocations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  userSiqs: number | null,
  maxInitialResults: number
) {
  const [filteredLocations, setFilteredLocations] = useState<SharedAstroSpot[]>([]);
  const [displayedLocations, setDisplayedLocations] = useState<SharedAstroSpot[]>([]);
  const [hasMoreLocations, setHasMoreLocations] = useState(false);

  // Apply filters based on user's parameters
  const applyFilters = useCallback((searchDistance: number) => {
    if (!userLocation || allLocations.length === 0) return;
    
    // Filter by distance
    const withinDistance = allLocations.filter(
      location => (location.distance || 0) <= searchDistance
    );
    
    // If user has a good SIQS, only show locations that are significantly better
    let betterLocations = withinDistance;
    if (userSiqs !== null) {
      betterLocations = withinDistance.filter(location => {
        if (!location.siqs) return false;
        
        // Use a lower improvement threshold for mountain areas
        const isMountain = isMountainousLocation(location);
        const threshold = isMountain ? SIQS_MOUNTAIN_THRESHOLD : SIQS_IMPROVEMENT_THRESHOLD;
        
        return location.siqs > userSiqs * threshold;
      });
    }
    
    // Sort by a weighted combination of SIQS and distance with improved algorithm
    const sortedLocations = betterLocations.sort((a, b) => {
      // First prioritize by cloud cover (the most important factor)
      // We estimate this from the SIQS score difference
      const siqsDiff = (b.siqs || 0) - (a.siqs || 0);
      
      // For significant SIQS difference, prioritize better SIQS
      if (Math.abs(siqsDiff) > 1.0) {
        return siqsDiff;
      }
      
      // For similar SIQS, mountains get priority over urban areas
      const aIsMountain = isMountainousLocation(a);
      const bIsMountain = isMountainousLocation(b);
      
      if (aIsMountain && !bIsMountain) return -1;
      if (!aIsMountain && bIsMountain) return 1;
      
      // For locations with similar SIQS and the same mountain status
      // Use our helper function that calculates a weighted score
      const aScore = calculateLocationScore(a, aIsMountain);
      const bScore = calculateLocationScore(b, bIsMountain);
      
      return bScore - aScore;
    });
    
    setFilteredLocations(sortedLocations);
    
    // Initialize displayed locations
    const initialLocations = sortedLocations.slice(0, maxInitialResults);
    setDisplayedLocations(initialLocations);
    
    // Check if there are more locations to load
    setHasMoreLocations(sortedLocations.length > initialLocations.length);
  }, [allLocations, userLocation, userSiqs, maxInitialResults]);

  // Load more locations
  const loadMoreLocations = useCallback(() => {
    setDisplayedLocations(prev => {
      const newLocations = filteredLocations.slice(0, prev.length + maxInitialResults);
      setHasMoreLocations(filteredLocations.length > newLocations.length);
      return newLocations;
    });
  }, [filteredLocations, maxInitialResults]);

  return {
    filteredLocations,
    displayedLocations,
    hasMoreLocations,
    applyFilters,
    loadMoreLocations
  };
}
