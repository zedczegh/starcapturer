
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { findLocationsWithinRadius } from "@/services/locationSearchService";
import { batchCalculateSiqs } from '@/services/realTimeSiqsService';
import { calculateDistance } from "@/data/utils/distanceCalculator";
import { useRecommendedLocationsSearch } from "./useRecommendedLocationsSearch";
import { useRecommendedLocationsState } from "./useRecommendedLocationsState";

// Maximum search distance
const MAX_SEARCH_DISTANCE = 10000; // 10,000 km

/**
 * Hook to fetch and manage recommended photo point locations
 */
export const useRecommendedLocations = (
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number = 1000,
  maxInitialResults: number = 10
) => {
  const { language, t } = useLanguage();
  
  // Use dedicated hooks for state management and search functionality
  const {
    loading,
    searching,
    allLocations,
    filteredLocations,
    displayedLocations,
    hasMoreLocations,
    setLoading,
    setSearching,
    setAllLocations,
    setFilteredLocations,
    setDisplayedLocations,
    setHasMoreLocations
  } = useRecommendedLocationsState();
  
  const {
    searchLocations,
    abortCurrentSearch
  } = useRecommendedLocationsSearch(
    setLoading,
    setSearching,
    setAllLocations,
    setFilteredLocations,
    setDisplayedLocations,
    setHasMoreLocations,
    maxInitialResults,
    language
  );
  
  // Validated search radius setter
  const setSearchRadius = useCallback((distance: number) => {
    return Math.min(Math.max(100, distance), MAX_SEARCH_DISTANCE);
  }, []);
  
  // Load recommended locations based on user location and search radius
  const loadRecommendedLocations = useCallback(async (reset: boolean = true) => {
    if (!userLocation) return;
    
    await searchLocations(userLocation, searchRadius, reset);
  }, [userLocation, searchRadius, searchLocations]);
  
  // Initial fetch when userLocation changes
  useEffect(() => {
    if (userLocation) {
      loadRecommendedLocations(true);
    }
    
    return () => {
      abortCurrentSearch();
    };
  }, [userLocation, loadRecommendedLocations, abortCurrentSearch]);
  
  // Update when search distance changes
  useEffect(() => {
    if (userLocation) {
      loadRecommendedLocations(false);
    }
  }, [searchRadius, loadRecommendedLocations, userLocation]);
  
  // Load more locations
  const loadMore = useCallback(() => {
    const currentCount = displayedLocations.length;
    const newLocations = filteredLocations.slice(0, currentCount + maxInitialResults);
    
    setDisplayedLocations(newLocations);
    setHasMoreLocations(filteredLocations.length > newLocations.length);
  }, [filteredLocations, displayedLocations.length, maxInitialResults, setDisplayedLocations, setHasMoreLocations]);
  
  // Function to refresh data
  const refreshSiqsData = useCallback(() => {
    if (!userLocation) return;
    
    toast.info(
      language === "en" 
        ? "Refreshing location data..." 
        : "正在刷新位置数据...",
      { 
        description: language === "en" 
          ? "Getting the latest SIQS and weather information" 
          : "获取最新的SIQS和天气信息"
      }
    );
    
    // Force a refresh with the current parameters
    loadRecommendedLocations(true);
  }, [userLocation, loadRecommendedLocations, language]);
  
  return {
    loading: loading || searching,
    displayedLocations,
    hasMore: hasMoreLocations,
    loadMore,
    refreshSiqsData,
    totalLocationsCount: filteredLocations.length,
    setSearchRadius
  };
};
