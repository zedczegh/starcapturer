
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { PhotoPointsViewMode } from '@/components/photoPoints/ViewToggle';

interface UseViewToggleProps {
  activeView: PhotoPointsViewMode;
  onViewChange: (view: PhotoPointsViewMode) => void;
  loading: boolean;
}

export function useViewToggle({ activeView, onViewChange, loading }: UseViewToggleProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const debounceTimerRef = useRef<number | null>(null);
  
  // Optimized function to handle view changes with debounce protection
  const handleViewChange = useCallback((view: PhotoPointsViewMode) => {
    // Prevent rapid clicking - only trigger if not already in transition
    if (view !== activeView && !loading && !isTransitioning) {
      console.log(`ViewToggle: Switching to ${view} view`);
      
      // Set transitioning state to prevent further clicks
      setIsTransitioning(true);
      
      // Clear any existing timeout
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      
      // Schedule the state change using requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        // Call the handler
        onViewChange(view);
        
        // Reset transition state after a delay
        debounceTimerRef.current = window.setTimeout(() => {
          setIsTransitioning(false);
          debounceTimerRef.current = null;
        }, 1000); // 1 second protection against repeated clicks
      });
    }
  }, [activeView, onViewChange, loading, isTransitioning]);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  // Determine if button should be disabled
  const certifiedDisabled = loading || isTransitioning || activeView === 'certified';
  const calculatedDisabled = loading || isTransitioning || activeView === 'calculated';
  
  return {
    isTransitioning,
    handleViewChange,
    certifiedDisabled,
    calculatedDisabled
  };
}
