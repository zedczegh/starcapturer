
import { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { clearLocationCache } from '@/services/realTimeSiqsService/locationUpdateService';
import { PhotoPointsViewMode } from '@/components/photoPoints/ViewToggle';

export const DEFAULT_CALCULATED_RADIUS = 100; // 100km default radius for calculated locations
export const DEFAULT_CERTIFIED_RADIUS = 10000; // 10000km for certified locations (no limit)

interface UsePhotoPointsViewProps {
  onSearchRadiusChange: (radius: number) => void;
}

/**
 * Hook to manage view state for photo points
 */
export const usePhotoPointsView = ({ onSearchRadiusChange }: UsePhotoPointsViewProps) => {
  const [activeView, setActiveView] = useState<PhotoPointsViewMode>('certified');
  const [showMap, setShowMap] = useState(true);
  const [calculatedSearchRadius, setCalculatedSearchRadius] = useState<number>(DEFAULT_CALCULATED_RADIUS);
  const { t } = useLanguage();

  const handleRadiusChange = useCallback((value: number) => {
    if (activeView === 'calculated') {
      setCalculatedSearchRadius(value);
      onSearchRadiusChange(value);
    }
  }, [onSearchRadiusChange, activeView]);
  
  const handleViewChange = useCallback((view: PhotoPointsViewMode) => {
    setActiveView(view);
    
    if (view === 'certified') {
      onSearchRadiusChange(DEFAULT_CERTIFIED_RADIUS);
    } else {
      onSearchRadiusChange(calculatedSearchRadius);
    }
    
    clearLocationCache();
  }, [onSearchRadiusChange, calculatedSearchRadius]);

  const toggleMapView = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);

  // Update search radius when active view changes
  useEffect(() => {
    if (activeView === 'certified') {
      onSearchRadiusChange(DEFAULT_CERTIFIED_RADIUS);
    } else {
      onSearchRadiusChange(calculatedSearchRadius);
    }
  }, [activeView, calculatedSearchRadius, onSearchRadiusChange]);

  return {
    activeView,
    showMap,
    calculatedSearchRadius,
    handleRadiusChange,
    handleViewChange,
    toggleMapView
  };
};
