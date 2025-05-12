
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { fetchCommunityAstroSpots } from "@/lib/api/fetchCommunityAstroSpots";
import { sortLocationsBySiqs } from "@/utils/siqsHelpers";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useNavigate } from "react-router-dom";
import { clearCache } from "@/utils/fetchWithCache";
import { clearSpotCache, prepareForProfileTransition } from "@/utils/cache/spotCacheCleaner";

export const useCommunityAstroSpots = () => {
  const navigate = useNavigate();

  // States for SIQS handling
  const [realTimeSiqs, setRealTimeSiqs] = useState<Record<string, number | null>>({});
  const [loadingSiqs, setLoadingSiqs] = useState<Record<string, boolean>>({});
  const [siqsConfidence, setSiqsConfidence] = useState<Record<string, number>>({});
  const [stabilizedSiqs, setStabilizedSiqs] = useState<Record<string, number | null>>({});
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [isNavigatingToSpot, setIsNavigatingToSpot] = useState(false);

  // Use React Query to fetch data with improved caching
  const { data: astrospots, isLoading, refetch } = useQuery({
    queryKey: ["community-astrospots-supabase"],
    queryFn: fetchCommunityAstroSpots,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Function to force data refresh
  const refreshData = useCallback(async () => {
    console.log("Refreshing community data...");
    // Clear any cached data
    clearCache();
    // Refetch data
    await refetch();
  }, [refetch]);

  // Handle SIQS calculation results with rate limiting for mobile
  const handleSiqsCalculated = useCallback((spotId: string, siqs: number | null, loading: boolean, confidence?: number) => {
    setLoadingSiqs(prev => ({
      ...prev,
      [spotId]: loading
    }));
    
    if (siqs !== null) {
      setRealTimeSiqs(prev => ({
        ...prev,
        [spotId]: siqs
      }));
      
      // Update stabilized scores to prevent flickering
      if (siqs > 0) {
        setStabilizedSiqs(prev => ({
          ...prev, 
          [spotId]: siqs
        }));
      }
    }
    
    if (confidence) {
      setSiqsConfidence(prev => ({
        ...prev,
        [spotId]: confidence
      }));
    }
  }, []);

  // Track user location for better map experience
  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    console.log("Location updated:", lat, lng);
    setUserLocation([lat, lng]);
  }, []);

  // Sort locations by SIQS scores (highest first)
  const sortedAstroSpots = useMemo(() => {
    if (!astrospots) return [];
    
    // Add real-time SIQS values to spots for sorting
    const spotsWithRealtimeSiqs = astrospots.map(spot => ({
      ...spot,
      realTimeSiqs: stabilizedSiqs[spot.id] ?? realTimeSiqs[spot.id] ?? spot.siqs
    }));
    
    // Sort using the utility function
    return sortLocationsBySiqs(spotsWithRealtimeSiqs);
  }, [astrospots, realTimeSiqs, stabilizedSiqs]);

  // Improved navigation function with better error handling and detailed logging
  const navigateToAstroSpot = useCallback((spotId: string) => {
    if (!spotId) {
      console.error("Cannot navigate: Invalid spot ID");
      return;
    }
    
    if (isNavigatingToSpot) {
      console.log("Navigation already in progress, ignoring rapid click");
      return;
    }
    
    const now = Date.now();
    
    // Prevent rapid double-clicking issues by tracking last clicked ID and time
    if (spotId === lastClickedId && now - lastClickTime < 800) {
      console.log("Ignoring rapid double click on same spot:", spotId);
      return;
    }
    
    setIsNavigatingToSpot(true);
    setLastClickedId(spotId);
    setLastClickTime(now);
    
    // Always use a unique timestamp for each navigation to force remounting
    const timestamp = now;
    console.log("Navigating to astro spot profile:", spotId, "timestamp:", timestamp);
    
    // Clear specific spot cache before navigation
    clearSpotCache(spotId);
    
    // Tell the system we're starting a profile transition for smoother animation
    prepareForProfileTransition();
    
    // The key is to completely replace any existing navigation state and use
    // a unique timestamp for each navigation
    navigate(`/astro-spot/${spotId}`, { 
      state: { 
        from: 'community',
        spotId: spotId,
        timestamp 
      },
      replace: false // Create a new history entry
    });
    
    // Reset navigation state after a delay
    setTimeout(() => {
      setIsNavigatingToSpot(false);
    }, 500);
  }, [navigate, lastClickedId, lastClickTime, isNavigatingToSpot]);

  // Handle card click by using the shared navigation function
  const handleCardClick = useCallback((id: string) => {
    console.log("Card click handler received ID:", id);
    navigateToAstroSpot(id);
  }, [navigateToAstroSpot]);
  
  // Handle map marker click by extracting the ID and using the shared navigation function
  const handleMarkerClick = useCallback((spot: SharedAstroSpot) => {
    if (!spot || !spot.id) {
      console.error("Invalid spot data received in marker click:", spot);
      return;
    }
    console.log("Marker click handler received spot:", spot.id);
    navigateToAstroSpot(spot.id);
  }, [navigateToAstroSpot]);

  // Effect to start staggered loading of SIQS data
  useEffect(() => {
    if (!astrospots || astrospots.length === 0) return;
    
    // Identify spots that need SIQS loading
    const spotsThatNeedLoading = astrospots.filter(spot => 
      !realTimeSiqs[spot.id] && !loadingSiqs[spot.id]
    );
    
    if (spotsThatNeedLoading.length === 0) return;
    
    // Loading in batches based on device type
    const isMobile = window.innerWidth < 768;
    const batchSize = isMobile ? 2 : 5;
    const delay = isMobile ? 400 : 200;
    
    // Schedule loading of each batch
    spotsThatNeedLoading.slice(0, 10).forEach((spot, index) => {
      const batchIndex = Math.floor(index / batchSize);
      setTimeout(() => {
        setLoadingSiqs(prev => ({
          ...prev,
          [spot.id]: true
        }));
      }, delay * batchIndex);
    });
  }, [astrospots, realTimeSiqs, loadingSiqs]);

  return {
    astrospots,
    isLoading,
    sortedAstroSpots,
    realTimeSiqs,
    stabilizedSiqs,
    loadingSiqs,
    userLocation,
    handleSiqsCalculated,
    handleLocationUpdate,
    handleCardClick,
    handleMarkerClick,
    refreshData
  };
};
