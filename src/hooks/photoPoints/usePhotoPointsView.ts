
import { useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { clearLocationCache } from '@/services/realTimeSiqsService/locationUpdateService';
import { PhotoPointsViewMode } from '@/components/photoPoints/ViewToggle';
import { useViewState } from './useViewState';
import { useSearchRadius, DEFAULT_CALCULATED_RADIUS, DEFAULT_CERTIFIED_RADIUS } from './useSearchRadius';

interface UsePhotoPointsViewProps {
  onSearchRadiusChange: (radius: number) => void;
}

/**
 * Hook to manage view state for photo points
 */
export const usePhotoPointsView = ({ onSearchRadiusChange }: UsePhotoPointsViewProps) => {
  const { t } = useLanguage();
  
  // Use separate hooks for view state and search radius
  const { activeView, showMap, changeViewMode, toggleMapView } = useViewState();
  
  const { calculatedSearchRadius, handleRadiusChange } = useSearchRadius({
    onSearchRadiusChange,
    activeView
  });
  
  // Handle view mode change with side effects
  const handleViewChange = useCallback((view: PhotoPointsViewMode) => {
    changeViewMode(view);
    
    if (view === 'certified') {
      onSearchRadiusChange(DEFAULT_CERTIFIED_RADIUS);
    } else {
      onSearchRadiusChange(calculatedSearchRadius);
    }
    
    clearLocationCache();
  }, [changeViewMode, onSearchRadiusChange, calculatedSearchRadius]);
  
  return {
    activeView,
    showMap,
    calculatedSearchRadius,
    handleRadiusChange,
    handleViewChange,
    toggleMapView
  };
};

// Re-export constants
export { DEFAULT_CALCULATED_RADIUS, DEFAULT_CERTIFIED_RADIUS };
