
import { useState, useCallback, useEffect } from 'react';
import { PhotoPointsViewMode } from '@/components/photoPoints/ViewToggle';
import { clearLocationCache } from '@/services/realTimeSiqsService/locationUpdateService';

export const DEFAULT_CALCULATED_RADIUS = 100; // 100km default radius for calculated locations
export const DEFAULT_CERTIFIED_RADIUS = 10000; // 10000km for certified locations (no limit)

interface UseSearchRadiusProps {
  onSearchRadiusChange: (radius: number) => void;
  activeView: PhotoPointsViewMode;
}

/**
 * Hook to manage search radius for photo points
 */
export const useSearchRadius = ({ 
  onSearchRadiusChange, 
  activeView 
}: UseSearchRadiusProps) => {
  const [calculatedSearchRadius, setCalculatedSearchRadius] = useState<number>(DEFAULT_CALCULATED_RADIUS);
  
  // Handle radius change from UI slider
  const handleRadiusChange = useCallback((value: number) => {
    if (activeView === 'calculated') {
      setCalculatedSearchRadius(value);
      onSearchRadiusChange(value);
    }
  }, [onSearchRadiusChange, activeView]);
  
  // Update search radius when active view changes
  useEffect(() => {
    if (activeView === 'certified') {
      onSearchRadiusChange(DEFAULT_CERTIFIED_RADIUS);
    } else {
      onSearchRadiusChange(calculatedSearchRadius);
    }
  }, [activeView, calculatedSearchRadius, onSearchRadiusChange]);
  
  return {
    calculatedSearchRadius,
    handleRadiusChange
  };
};
