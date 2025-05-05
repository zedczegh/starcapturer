
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Component to apply mobile-specific fixes for common map issues
 * Optimized for better performance on low-end devices
 */
export const MobileMapFixer: React.FC = () => {
  const map = useMap();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!map || !isMobile) return;
    
    // Fix for marker positioning issues during zoom
    const fixMarkerPositioning = () => {
      if (!map._panes) return;
      
      try {
        // Apply hardware acceleration to marker pane
        const markerPane = map._panes.markerPane;
        if (markerPane) {
          markerPane.style.willChange = 'transform';
          markerPane.style.transform = 'translate3d(0,0,0)';
          setTimeout(() => {
            if (markerPane) {
              markerPane.style.zIndex = String(parseInt(markerPane.style.zIndex || '600') + 1);
              setTimeout(() => {
                if (markerPane) markerPane.style.zIndex = '600';
              }, 5);
            }
          }, 50);
        }
      } catch (error) {
        // Silent catch to prevent errors
      }
    };
    
    // More efficient map size validation
    const ensureMapSize = () => {
      try {
        map.invalidateSize({ animate: false, pan: false });
        
        const container = map.getContainer();
        if (container && (container.clientWidth === 0 || container.clientHeight === 0)) {
          setTimeout(() => map.invalidateSize(), 100);
        }
      } catch (error) {
        // Silent catch to prevent errors
      }
    };
    
    // Run size check on initialization but with delay to ensure DOM is ready
    setTimeout(ensureMapSize, 50);
    
    // More efficient event listeners with throttling
    const throttledFix = throttle(fixMarkerPositioning, 100);
    const throttledSize = throttle(ensureMapSize, 200);
    
    map.on('zoomanim', throttledFix);
    map.on('zoomend', throttledFix);
    map.on('moveend', throttledFix);
    map.on('resize', throttledSize);
    
    // iOS Safari specific fixes with fewer DOM manipulations
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      try {
        // Apply one-time style fixes
        if (map._panes.tilePane) {
          map._panes.tilePane.style.webkitBackfaceVisibility = 'hidden';
        }
        
        // Simplified marker refresh for iOS
        const iosZoomFix = throttle(() => {
          if (map._panes?.markerPane) {
            const opacity = map._panes.markerPane.style.opacity || '1';
            map._panes.markerPane.style.opacity = '0.99';
            setTimeout(() => {
              if (map._panes?.markerPane) map._panes.markerPane.style.opacity = opacity;
            }, 5);
          }
        }, 150);
        
        map.on('zoom', iosZoomFix);
      } catch (error) {
        // Silent catch to prevent errors
      }
    }
    
    return () => {
      // Clean up all event listeners
      map.off('zoomanim', throttledFix);
      map.off('zoomend', throttledFix);
      map.off('moveend', throttledFix);
      map.off('resize', throttledSize);
      if (isIOS) map.off('zoom');
    };
  }, [map, isMobile]);
  
  return null;
};

// Simple throttle implementation
function throttle(func: Function, limit: number) {
  let inThrottle: boolean = false;
  return function(...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export default React.memo(MobileMapFixer);
