
import { useState, useEffect } from 'react';

interface AnimationStateProps {
  isScanning: boolean;
}

/**
 * Custom hook to manage animation visibility state
 */
export const useAnimationState = ({ isScanning }: AnimationStateProps) => {
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Handle animation visibility based on scanning state
  useEffect(() => {
    if (isScanning) {
      setShowAnimation(true);
    } else {
      // Add a delay before hiding the animation for smoother UX
      const timeout = setTimeout(() => {
        setShowAnimation(false);
      }, 2000);
      
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isScanning]);
  
  return { showAnimation };
};
