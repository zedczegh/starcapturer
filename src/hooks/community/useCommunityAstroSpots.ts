
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { fetchCommunityAstroSpots } from "@/lib/api/fetchCommunityAstroSpots";
import { sortLocationsBySiqs } from "@/utils/siqsHelpers";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useNavigate } from "react-router-dom";

export const useCommunityAstroSpots = () => {
  const navigate = useNavigate();

  // States for SIQS handling
  const [realTimeSiqs, setRealTimeSiqs] = useState<Record<string, number | null>>({});
  const [loadingSiqs, setLoadingSiqs] = useState<Record<string, boolean>>({});
  const [siqsConfidence, setSiqsConfidence] = useState<Record<string, number>>({});
  const [stabilizedSiqs, setStabilizedSiqs] = useState<Record<string, number | null>>({});
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Use React Query to fetch data with improved caching
  const { data: astrospots, isLoading } = useQuery({
    queryKey: ["community-astrospots-supabase"],
    queryFn: fetchCommunityAstroSpots,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

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

  // Navigate to astro spot profile with proper state
  const handleCardClick = useCallback((id: string) => {
    // Ensure we're passing the correct state to properly identify where we came from
    navigate(`/astro-spot/${id}`, { 
      state: { 
        from: 'community',
        spotId: id 
      } 
    });
    console.log("Navigating to astro spot:", id);
  }, [navigate]);
  
  // Modified handler for map marker clicks that accepts SharedAstroSpot
  const handleMarkerClick = useCallback((spot: SharedAstroSpot) => {
    handleCardClick(spot.id);
  }, [handleCardClick]);

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
    handleMarkerClick
  };
};
