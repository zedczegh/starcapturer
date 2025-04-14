
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
    // Always initialize timeout ref even if we don't use it
    let timeout: ReturnType<typeof setTimeout> | undefined;
    
    // Update animation state based on scanning status
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
