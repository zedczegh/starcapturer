
import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface UsePhotoPointsSearchProps {
  userLocation: { latitude: number; longitude: number } | null;
  currentSiqs: number | null;
  searchRadius?: number;
  maxInitialResults?: number;
}

export const usePhotoPointsSearch = ({
  userLocation,
  currentSiqs,
  searchRadius = 100,
  maxInitialResults = 5
}: UsePhotoPointsSearchProps) => {
  const [displayedLocations, setDisplayedLocations] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeView, setActiveView] = useState<'certified' | 'calculated'>('certified');

  // Function to refresh data
  const refresh = useCallback(() => {
    setLoading(true);
    // This would typically call an API or service
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  // Function to switch view type
  const switchView = useCallback((view: 'certified' | 'calculated') => {
    setActiveView(view);
  }, []);

  return {
    displayedLocations,
    loading,
    searching,
    refresh,
    switchView,
    activeView
  };
};

export default usePhotoPointsSearch;
