
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface SiqsEffectsControllerProps {
  userLocation: { latitude: number; longitude: number } | null;
  activeView: 'certified' | 'calculated' | 'obscura' | 'mountains';
  searchRadius: number;
  onSiqsCalculated?: (siqs: number) => void;
  disabled?: boolean;
}

const SiqsEffectsController: React.FC<SiqsEffectsControllerProps> = ({
  userLocation,
  activeView,
  searchRadius,
  onSiqsCalculated,
  disabled = false
}) => {
  // Always call useMap hook regardless of disabled state
  const map = useMap();
  
  // Only apply effects if not disabled and userLocation is available
  useEffect(() => {
    if (disabled || !userLocation || !map) return;
    
    // Calculate and update SIQS data based on user location and map position
    const calculateSiqs = async () => {
      try {
        // Simulate SIQS calculation result
        const simulatedSiqs = Math.round((Math.random() * 3 + 5) * 10) / 10;
        
        // Call the callback if provided
        if (onSiqsCalculated) {
          onSiqsCalculated(simulatedSiqs);
        }
      } catch (error) {
        console.error("Error calculating SIQS:", error);
      }
    };
    
    calculateSiqs();
    
    // No need for cleanup as we're not setting up listeners
  }, [map, userLocation, activeView, searchRadius, onSiqsCalculated, disabled]);
  
  return null; // This component doesn't render anything
};

export default SiqsEffectsController;
