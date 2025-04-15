
import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocationState } from '@/hooks/location/useLocationState';

export const usePhotoPointsState = () => {
  const { t } = useLanguage();
  const location = useLocation();
  
  // For view toggling
  const [activeView, setActiveView] = useState<'certified' | 'calculated'>('certified');
  
  // For layout toggling
  const [showMap, setShowMap] = useState(false);
  
  // For initializing states
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Use shared location state hook
  const { 
    locationLoading, effectiveLocation, 
    handleLocationUpdate, handleResetLocation 
  } = useLocationState();

  // Default calculated search radius set to 500km
  const [calculatedSearchRadius, setCalculatedSearchRadius] = useState(500);
  
  // Determine the current search radius based on active view
  const currentSearchRadius = activeView === 'certified' ? 20000 : calculatedSearchRadius;
  
  // Handle search radius slider change
  const handleRadiusChange = useCallback((value: number) => {
    setCalculatedSearchRadius(value);
  }, []);
  
  // Toggle between certified and calculated views
  const handleViewChange = useCallback((view: 'certified' | 'calculated') => {
    setActiveView(view);
    
    // No need to auto-refresh when user changes views
  }, []);
  
  // Toggle between map and list views
  const toggleMapView = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);
  
  // Set initial load flag to false after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  
  return {
    activeView,
    showMap,
    initialLoad,
    locationLoading,
    effectiveLocation,
    calculatedSearchRadius,
    currentSearchRadius,
    handleRadiusChange,
    handleViewChange,
    handleLocationUpdate, // This function doesn't auto-refresh now
    handleResetLocation,
    toggleMapView
  };
};

export default usePhotoPointsState;
