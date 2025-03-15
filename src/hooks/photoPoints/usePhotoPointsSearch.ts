
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/data/utils/distanceCalculator";
import { useFetchPhotoLocations } from "./useFetchPhotoLocations";
import { useLocationFiltering } from "./useLocationFiltering";
import { useUserRegionName } from "./useUserRegionName";

interface UsePhotoPointsSearchProps {
  userLocation: { latitude: number; longitude: number } | null;
  currentSiqs: number | null;
  maxInitialResults?: number;
}

export const usePhotoPointsSearch = ({
  userLocation,
  currentSiqs,
  maxInitialResults = 5
}: UsePhotoPointsSearchProps) => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchDistance, setSearchDistance] = useState(1000); // Default 1000km
  const [isUserInGoodLocation, setIsUserInGoodLocation] = useState(false);
  
  // Extract user region name using a custom hook
  const { userRegionName } = useUserRegionName(userLocation, language);
  
  // Use custom hook for fetching locations
  const { 
    allLocations, 
    fetchLocations, 
    calculatedUserSiqs 
  } = useFetchPhotoLocations(
    userLocation, 
    currentSiqs, 
    searchDistance, 
    setSearching, 
    setLoading, 
    setIsUserInGoodLocation
  );
  
  // Use custom hook for filtering and pagination
  const {
    filteredLocations,
    displayedLocations,
    hasMoreLocations, 
    applyFilters,
    loadMoreLocations
  } = useLocationFiltering(
    allLocations, 
    userLocation, 
    calculatedUserSiqs || currentSiqs, 
    maxInitialResults
  );
  
  // Call applyFilters when search parameters change
  useEffect(() => {
    if (allLocations.length > 0) {
      applyFilters(searchDistance);
    }
  }, [allLocations, searchDistance, applyFilters]);
  
  // Fetch locations when user location changes
  useEffect(() => {
    if (userLocation) {
      fetchLocations();
    }
  }, [userLocation, searchDistance, fetchLocations]);
  
  return {
    loading,
    searching,
    searchDistance,
    setSearchDistance,
    displayedLocations,
    hasMoreLocations,
    loadMoreLocations,
    isUserInGoodLocation,
    userRegionName
  };
};
