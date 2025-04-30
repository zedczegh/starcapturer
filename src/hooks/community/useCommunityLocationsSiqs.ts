import React from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useDebouncedCallback } from "@/hooks/useDebounce";

export function useCommunityLocationsSiqs(locations: SharedAstroSpot[] | null) {
  const [realTimeSiqs, setRealTimeSiqs] = React.useState<Record<string, number | null>>({});
  const [loadingSiqs, setLoadingSiqs] = React.useState<Record<string, boolean>>({});
  const [attemptedSiqs, setAttemptedSiqs] = React.useState<Set<string>>(new Set());
  const [calculationQueue, setCalculationQueue] = React.useState<string[]>([]);

  // Initialize visible spots for SIQS calculation
  React.useEffect(() => {
    if (!locations) return;
    
    // Queue up initial calculations with a small delay
    const initialSpots = locations.slice(0, 8).map(spot => spot.id);
    setCalculationQueue(initialSpots);
    
    // Pre-populate with existing SIQS data from locations
    const initialSiqs: Record<string, number | null> = {};
    locations.forEach(spot => {
      if (spot.siqs) {
        if (typeof spot.siqs === 'number') {
          initialSiqs[spot.id] = spot.siqs;
        } else if (typeof spot.siqs === 'object' && 'score' in spot.siqs) {
          initialSiqs[spot.id] = spot.siqs.score;
        }
      }
    });
    setRealTimeSiqs(prev => ({...prev, ...initialSiqs}));
  }, [locations]);

  // Batch SIQS updates with priority queue
  React.useEffect(() => {
    if (!locations || locations.length === 0 || calculationQueue.length === 0) return;
    
    // Process queue with a delay to prevent overwhelming the system
    const timer = setTimeout(() => {
      const spotId = calculationQueue[0];
      setCalculationQueue(prev => prev.slice(1));
      
      // Mark this spot as being calculated
      setLoadingSiqs(prev => ({
        ...prev,
        [spotId]: true
      }));
      
    }, 250);
    
    return () => clearTimeout(timer);
  }, [calculationQueue, locations]);

  const debouncedSiqsUpdate = useDebouncedCallback((spotId: string, siqs: number | null, loading: boolean) => {
    console.log(`SIQS update for ${spotId}: ${siqs}, loading: ${loading}`);
    
    setRealTimeSiqs(prev => ({
      ...prev,
      [spotId]: siqs
    }));
    
    setLoadingSiqs(prev => ({
      ...prev,
      [spotId]: loading
    }));
    
    if (!loading) {
      setAttemptedSiqs(prev => {
        const updated = new Set(prev);
        updated.add(spotId);
        return updated;
      });
    }
  }, 250);

  const handleSiqsError = React.useCallback((error: any, spotId: string) => {
    console.error(`SIQS calculation error for spot ${spotId}:`, error);
    
    // Mark as attempted so we don't keep trying
    setAttemptedSiqs(prev => {
      const updated = new Set(prev);
      updated.add(spotId);
      return updated;
    });
    
    setLoadingSiqs(prev => ({
      ...prev,
      [spotId]: false
    }));
  }, []);

  const handleCardInView = React.useCallback((spotId: string) => {
    if (!attemptedSiqs.has(spotId) && !calculationQueue.includes(spotId)) {
      setCalculationQueue(prev => [...prev, spotId]);
    }
  }, [attemptedSiqs, calculationQueue]);

  // Get SIQS value for a spot (from real-time calculation or fallback to original)
  const getSiqsForSpot = React.useCallback((spot: SharedAstroSpot) => {
    const realTimeSiqsValue = realTimeSiqs[spot.id];
    
    // Use real-time SIQS if available
    if (realTimeSiqsValue !== undefined) {
      return realTimeSiqsValue;
    }
    
    // Fall back to the original SIQS from the spot data
    return spot.siqs;
  }, [realTimeSiqs]);

  return {
    realTimeSiqs,
    loadingSiqs,
    attemptedSiqs,
    calculationQueue,
    getSiqsForSpot,
    debouncedSiqsUpdate,
    handleSiqsError,
    handleCardInView
  };
}
