
import { useState, useCallback } from 'react';

export const useMapEffects = () => {
  const [legendOpen, setLegendOpen] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  
  const handleLegendToggle = useCallback((isOpen: boolean) => {
    setLegendOpen(isOpen);
  }, []);

  return {
    legendOpen,
    isUpdatingLocation,
    setIsUpdatingLocation,
    handleLegendToggle
  };
};

