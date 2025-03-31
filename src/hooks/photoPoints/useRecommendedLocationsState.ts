
import { useState } from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";

/**
 * State management hook for recommended locations
 * Extracts state management from the main useRecommendedLocations hook
 */
export const useRecommendedLocationsState = () => {
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [allLocations, setAllLocations] = useState<SharedAstroSpot[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<SharedAstroSpot[]>([]);
  const [displayedLocations, setDisplayedLocations] = useState<SharedAstroSpot[]>([]);
  const [hasMoreLocations, setHasMoreLocations] = useState(false);
  
  return {
    // State values
    loading,
    searching,
    allLocations,
    filteredLocations,
    displayedLocations,
    hasMoreLocations,
    
    // State setters
    setLoading,
    setSearching,
    setAllLocations,
    setFilteredLocations,
    setDisplayedLocations,
    setHasMoreLocations
  };
};
