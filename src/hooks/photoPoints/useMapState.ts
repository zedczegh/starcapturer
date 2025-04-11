
import { useState, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Hook to manage map state for the PhotoPointsMap component
 */
export const useMapState = () => {
  const [selectedMapLocation, setSelectedMapLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [mapLoadedOnce, setMapLoadedOnce] = useState(false);
  const [key, setKey] = useState(`map-${Date.now()}`);
  const [combinedCalculatedLocations, setCombinedCalculatedLocations] = useState<SharedAstroSpot[]>([]);
  const [loadingPhase, setLoadingPhase] = useState<'initial' | 'fetching' | 'processing' | 'ready' | 'changing_location'>('initial');
  const [locationStats, setLocationStats] = useState<{certified: number, calculated: number}>({ certified: 0, calculated: 0 });

  /**
   * Update the loading phase of the map
   */
  const updateLoadingPhase = useCallback((phase: 'initial' | 'fetching' | 'processing' | 'ready' | 'changing_location') => {
    setLoadingPhase(phase);
  }, []);

  /**
   * Force reload the map component with a new key
   */
  const forceMapReload = useCallback((viewType: string) => {
    setKey(`map-view-${viewType}-${Date.now()}`);
  }, []);

  /**
   * Update the map's selected location
   */
  const updateSelectedLocation = useCallback((location: {latitude: number; longitude: number} | null) => {
    setSelectedMapLocation(location);
  }, []);

  /**
   * Mark the map as loaded
   */
  const setMapLoaded = useCallback(() => {
    setMapLoadedOnce(true);
  }, []);

  /**
   * Update stats for location counts
   */
  const updateLocationStats = useCallback((certifiedCount: number, calculatedCount?: number) => {
    setLocationStats(prev => ({
      certified: certifiedCount,
      calculated: calculatedCount !== undefined ? calculatedCount : prev.calculated
    }));
  }, []);

  /**
   * Update combined calculated locations
   */
  const updateCombinedLocations = useCallback((locations: SharedAstroSpot[]) => {
    setCombinedCalculatedLocations(locations);
  }, []);

  return {
    selectedMapLocation,
    mapLoadedOnce,
    key,
    combinedCalculatedLocations,
    loadingPhase,
    locationStats,
    updateLoadingPhase,
    forceMapReload,
    updateSelectedLocation,
    setMapLoaded,
    updateLocationStats,
    updateCombinedLocations
  };
};
