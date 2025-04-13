
import { useState, useEffect } from 'react';

/**
 * Enhanced hook to detect mobile devices with better reliability
 * Accounts for modern devices and different screen sizes
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  useEffect(() => {
    // Function to check if the device is mobile
    const checkMobile = () => {
      // Check for touch support (most reliable indicator)
      const hasTouch = 'ontouchstart' in window || 
                       navigator.maxTouchPoints > 0 || 
                       (navigator as any).msMaxTouchPoints > 0;
      
      // Check for mobile user agent (less reliable but still useful)
      const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      // Check screen width (most devices under 768px are considered mobile)
      const narrowScreen = window.innerWidth < 768;
      
      // iOS-specific detection that works even in browsers that spoof UA
      const isIOS = /iPad|iPhone|iPod/.test(navigator.platform) ||
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      // Combined check giving more weight to touch support and screen size
      return (hasTouch && narrowScreen) || 
             (mobileUA && narrowScreen) || 
             isIOS ||
             narrowScreen; // Fall back to screen size if other checks are inconclusive
    };
    
    // Set initial state
    setIsMobile(checkMobile());
    
    // Update on resize
    const handleResize = () => {
      setIsMobile(checkMobile());
    };
    
    // Handle orientation changes explicitly for better reliability on mobile
    const handleOrientationChange = () => {
      // Small delay to ensure dimensions have updated
      setTimeout(handleResize, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);
  
  return isMobile;
}
