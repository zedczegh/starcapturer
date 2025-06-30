
import { useState, useEffect } from 'react';

/**
 * Enhanced mobile detection with better performance and reliability
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  useEffect(() => {
    // Comprehensive mobile detection function
    const checkMobile = () => {
      // Primary check: screen width (most reliable for responsive design)
      const isNarrowScreen = window.innerWidth < 768;
      
      // Secondary check: touch capability
      const hasTouchSupport = 'ontouchstart' in window || 
                              navigator.maxTouchPoints > 0 || 
                              (navigator as any).msMaxTouchPoints > 0;
      
      // Tertiary check: user agent (fallback)
      const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      // Special handling for iPads in desktop mode
      const isPadInDesktopMode = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
      
      // Device pixel ratio check (helps identify high-DPI mobile devices)
      const isHighDPI = window.devicePixelRatio > 1.5;
      
      // Combined logic: prioritize screen width, but consider other factors
      const shouldBeMobile = isNarrowScreen || 
                           (hasTouchSupport && (mobileUserAgent || isPadInDesktopMode)) ||
                           (isNarrowScreen && isHighDPI);
      
      return shouldBeMobile;
    };
    
    // Set initial state
    setIsMobile(checkMobile());
    
    // Debounced resize handler for better performance
    let resizeTimeout: ReturnType<typeof setTimeout>;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setIsMobile(checkMobile());
      }, 150); // Debounce for 150ms
    };
    
    // Orientation change handler with delay for dimension updates
    const handleOrientationChange = () => {
      setTimeout(() => {
        setIsMobile(checkMobile());
      }, 100);
    };
    
    // Use passive listeners for better scroll performance
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange, { passive: true });
    
    // Cleanup
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);
  
  return isMobile;
}

// Additional hook for getting window dimensions (useful for precise mobile layouts)
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    // Debounced resize handler
    let resizeTimeout: ReturnType<typeof setTimeout>;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 100);
    };
    
    // Set initial size
    handleResize();
    
    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return windowSize;
}
