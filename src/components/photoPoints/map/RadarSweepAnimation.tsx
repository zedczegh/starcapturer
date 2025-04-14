
import React, { useEffect } from 'react';
import RadarAnimationStyles from './radar/RadarAnimationStyles';
import { useRadarPosition } from './radar/useRadarPosition';
import RadarCircle from './radar/RadarCircle';
import RadarElement from './radar/RadarElement';
import { useAnimationState } from './radar/AnimationStateManager';

interface RadarSweepAnimationProps {
  userLocation: { latitude: number; longitude: number };
  searchRadius: number;
  isScanning: boolean;
  isManualRadiusChange?: boolean;
}

const RadarSweepAnimation: React.FC<RadarSweepAnimationProps> = ({
  userLocation,
  searchRadius,
  isScanning,
  isManualRadiusChange = false
}) => {
  // Manage animation visibility state
  const { showAnimation } = useAnimationState({ 
    isScanning
  });

  // Calculate radar position on map
  const { radarStyles } = useRadarPosition({
    userLocation,
    searchRadius,
    showAnimation
  });

  // Clean up animations when component unmounts
  useEffect(() => {
    return () => {
      // Animation cleanup handled by child components
    };
  }, []);

  return (
    <>
      {/* Add radar styles to document */}
      <RadarAnimationStyles />
      
      {/* Render the circle with specified radius */}
      <RadarCircle 
        userLocation={userLocation} 
        searchRadius={searchRadius} 
        showCircle={showAnimation} 
        locationChanged={isManualRadiusChange}
      />
      
      {/* Render the radar sweep animation */}
      <RadarElement 
        radarStyles={radarStyles}
        showAnimation={showAnimation} 
      />
    </>
  );
};

export default RadarSweepAnimation;
