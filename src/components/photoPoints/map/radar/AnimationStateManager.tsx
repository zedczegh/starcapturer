
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
    let timeout: ReturnType<typeof setTimeout> | null = null;
    
    if (isScanning) {
      setShowAnimation(true);
    } else {
      // Add a delay before hiding the animation for smoother UX
      timeout = setTimeout(() => {
        setShowAnimation(false);
      }, 2000);
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [isScanning]);
  
  return { showAnimation };
};
