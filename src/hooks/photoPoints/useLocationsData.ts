
import { useState, useEffect } from 'react';
import { useCertifiedLocations } from '@/hooks/location/useCertifiedLocations';
import { useRecommendedLocations } from '@/hooks/photoPoints/useRecommendedLocations';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface UseLocationsDataProps {
  userLocation: { latitude: number; longitude: number } | null;
  activeView: 'certified' | 'calculated';
  calculatedSearchRadius: number;
  defaultCertifiedRadius: number;
}

export const useLocationsData = ({
  userLocation,
  activeView,
  calculatedSearchRadius,
  defaultCertifiedRadius
}: UseLocationsDataProps) => {
  const [searchRadius, setSearchRadius] = useState<number>(
    activeView === 'certified' ? defaultCertifiedRadius : calculatedSearchRadius
  );
  
  // Update search radius when view changes
  useEffect(() => {
    if (activeView === 'certified') {
      setSearchRadius(defaultCertifiedRadius);
    } else {
      setSearchRadius(calculatedSearchRadius);
    }
  }, [activeView, calculatedSearchRadius, defaultCertifiedRadius]);
  
  // Get recommended locations based on current search radius
  const {
    locations,
    loading,
    searching,
    hasMore,
    loadMore,
    refreshSiqsData,
    canLoadMoreCalculated,
    loadMoreCalculatedLocations,
    loadMoreClickCount,
    maxLoadMoreClicks
  } = useRecommendedLocations(
    userLocation, 
    searchRadius
  );

  // Separate certified and calculated locations
  const {
    certifiedLocations,
    calculatedLocations
  } = useCertifiedLocations(locations);
  
  return {
    locations,
    certifiedLocations,
    calculatedLocations,
    loading,
    searching,
    hasMore,
    loadMore,
    refreshSiqsData,
    canLoadMoreCalculated,
    loadMoreCalculatedLocations,
    loadMoreClickCount,
    maxLoadMoreClicks,
    searchRadius,
    setSearchRadius
  };
};

export default useLocationsData;
