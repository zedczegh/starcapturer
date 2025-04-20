
import { useState, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export function useMapState() {
  const [mapContainerHeight, setMapContainerHeight] = useState('450px');
  const [legendOpen, setLegendOpen] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const isMobile = useIsMobile();
  
  const handleLegendToggle = useCallback((isOpen: boolean) => {
    setLegendOpen(isOpen);
  }, []);

  return {
    mapContainerHeight,
    legendOpen,
    isUpdatingLocation,
    setIsUpdatingLocation,
    handleLegendToggle,
    isMobile
  };
}
