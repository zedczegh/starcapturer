
import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from "@tanstack/react-query";
import { fetchCommunityAstroSpots } from "@/lib/api/fetchCommunityAstroSpots";
import { sortLocationsBySiqs } from "@/utils/siqsHelpers";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useNavigate } from "react-router-dom";
import { clearCache } from "@/utils/fetchWithCache";

export const useCommunityAstroSpots = () => {
  const navigate = useNavigate();
  const navigationInProgressRef = useRef(false);
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // States for SIQS handling
  const [realTimeSiqs, setRealTimeSiqs] = useState<Record<string, number | null>>({});
  const [loadingSiqs, setLoadingSiqs] = useState<Record<string, boolean>>({});
  const [siqsConfidence, setSiqsConfidence] = useState<Record<string, number>>({});
  const [stabilizedSiqs, setStabilizedSiqs] = useState<Record<string, number | null>>({});
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [isNavigatingToSpot, setIsNavigatingToSpot] = useState(false);

  // Clean up all timers and flags when component unmounts
  useEffect(() => {
    navigationInProgressRef.current = false;
    return () => {
      navigationInProgressRef.current = false;
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
        navigationTimerRef.current = null;
      }
    };
  }, []);

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
  const sortedAstroSpots = astrospots ? sortLocationsBySiqs(astrospots.map(spot => ({
    ...spot,
    realTimeSiqs: stabilizedSiqs[spot.id] ?? realTimeSiqs[spot.id] ?? spot.siqs
  }))) : [];

  // Completely redesigned navigation function with better error handling and race condition prevention
  const navigateToAstroSpot = useCallback((spotId: string) => {
    if (!spotId) {
      console.error("Cannot navigate: Invalid spot ID");
      return;
    }
    
    // Clear any pending navigation timer
    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }
    
    // Prevent navigation if already in progress
    if (navigationInProgressRef.current) {
      console.log("Navigation already in progress, ignoring request for spot:", spotId);
      return;
    }
    
    const now = Date.now();
    console.log(`Navigating to astrospot: ${spotId} at ${now}`);
    
    // Set navigation flags to prevent duplicate navigations
    setIsNavigatingToSpot(true);
    navigationInProgressRef.current = true;
    
    // Update click tracking
    setLastClickedId(spotId);
    setLastClickTime(now);
    
    // Always use a unique timestamp for each navigation
    try {
      // Clean forced navigation approach
      navigate(`/astro-spot/${spotId}`, { 
        state: { 
          from: 'community',
          spotId: spotId,
          timestamp: now 
        },
        replace: false // Create a new history entry
      });
      
      console.log("Navigation dispatched successfully");
    } catch (error) {
      console.error("Navigation error:", error);
      setIsNavigatingToSpot(false);
      navigationInProgressRef.current = false;
    }
    
    // Reset navigation state after a reasonable delay
    navigationTimerRef.current = setTimeout(() => {
      setIsNavigatingToSpot(false);
      navigationInProgressRef.current = false;
      navigationTimerRef.current = null;
    }, 1000);
  }, [navigate]);

  // Simple event handlers that use the core navigation function
  const handleCardClick = useCallback((id: string) => {
    console.log("Card click handler received ID:", id);
    navigateToAstroSpot(id);
  }, [navigateToAstroSpot]);
  
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
}, []);
