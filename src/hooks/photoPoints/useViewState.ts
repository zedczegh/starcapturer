
import { useState, useCallback } from 'react';
import { PhotoPointsViewMode } from '@/components/photoPoints/ViewToggle';

/**
 * Hook for managing UI state of the photo points view
 */
export const useViewState = () => {
  const [activeView, setActiveView] = useState<PhotoPointsViewMode>('certified');
  const [showMap, setShowMap] = useState(true);
  
  /**
   * Toggle map/list view
   */
  const toggleMapView = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);
  
  /**
   * Change view mode between certified and calculated
   */
  const changeViewMode = useCallback((view: PhotoPointsViewMode) => {
    setActiveView(view);
  }, []);
  
  return {
    activeView,
    showMap,
    changeViewMode,
    toggleMapView
  };
};
